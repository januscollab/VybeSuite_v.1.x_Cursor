import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Story, Sprint, SprintStats } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useArchive } from './useArchive';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const useSupabaseStories = () => {
  const { user } = useAuth();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [operationLoading, setOperationLoading] = useState<Record<string, boolean>>({});

  const { archiveAllStoriesInSprint, archiveCompletedStories } = useArchive();

  // Set operation loading state
  const setOperationLoadingState = useCallback((operation: string, loading: boolean) => {
    setOperationLoading(prev => ({
      ...prev,
      [operation]: loading
    }));
  }, []);

  // Initialize data - create default sprints if they don't exist
  const initializeData = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if sprints exist
      const { data: existingSprints, error: sprintsError } = await supabase
        .from('sprints')
        .select('*')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .order('position');

      if (sprintsError) throw sprintsError;

      // If no sprints exist, create default ones
      if (!existingSprints || existingSprints.length === 0) {
        const defaultSprints = [
          {
            id: 'priority',
            title: 'Priority Sprint',
            icon: '🔥',
            is_backlog: false,
            is_draggable: false,
            position: 0,
            user_id: user.id
          },
          {
            id: 'development',
            title: 'Development Sprint',
            icon: '⚡',
            is_backlog: false,
            is_draggable: true,
            position: 1,
            user_id: user.id
          },
          {
            id: 'backlog',
            title: 'Backlog - Future Enhancements',
            icon: '📋',
            is_backlog: true,
            is_draggable: false,
            position: 2,
            user_id: user.id
          }
        ];

        const { error: upsertError } = await supabase
          .from('sprints')
          .upsert(defaultSprints, { onConflict: 'id' });

        if (upsertError) throw upsertError;
      } else {
        // Ensure Priority Sprint exists and is correctly positioned
        const prioritySprint = existingSprints.find(s => s.id === 'priority');
        if (!prioritySprint) {
          // Create Priority Sprint if it doesn't exist
          const { error: priorityError } = await supabase
            .from('sprints')
            .insert([{
              id: 'priority',
              title: 'Priority Sprint',
              icon: '🔥',
              is_backlog: false,
              is_draggable: false,
              position: 0,
              user_id: user.id
            }]);
          
          if (priorityError) throw priorityError;
        } else if (prioritySprint.position !== 0) {
          // Fix Priority Sprint position if it's wrong
          const { error: fixPositionError } = await supabase
            .from('sprints')
            .update({ 
              position: 0,
              is_backlog: false,
              is_draggable: false,
              title: 'Priority Sprint',
              icon: '🔥'
            })
            .eq('id', 'priority')
            .eq('user_id', user.id);
          
          if (fixPositionError) throw fixPositionError;
        }
      }

      // Load all data
      await loadData();
      setIsInitialized(true);
    } catch (err) {
      console.error('Error initializing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load sprints and stories from Supabase
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      // Load sprints
      const { data: sprintsData, error: sprintsError } = await supabase
        .from('sprints')
        .select('*')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .order('position');

      if (sprintsError) throw sprintsError;

      // Load stories
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .is('archived_at', null)
        .order('position');

      if (storiesError) throw storiesError;

      // Transform and combine data
      const transformedSprints: Sprint[] = (sprintsData || []).map(sprint => ({
        id: sprint.id,
        user_id: sprint.user_id,
        title: sprint.title,
        icon: sprint.icon,
        isBacklog: sprint.is_backlog,
        isDraggable: sprint.is_draggable,
        archivedAt: sprint.archived_at,
        stories: (storiesData || [])
          .filter(story => story.sprint_id === sprint.id)
          .map(story => ({
            id: story.id,
            number: story.number,
            title: story.title,
            description: story.description || '',
            completed: story.completed,
            date: story.date,
            tags: story.tags || [],
            completedAt: story.completed_at,
            sprintId: story.sprint_id,
            createdAt: story.created_at,
            updatedAt: story.updated_at,
            archivedAt: story.archived_at
          }))
      }));

      setSprints(transformedSprints);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
  }, [user]);

  // Enhanced real-time sprint change handler
  const handleSprintChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    console.log('Sprint change detected:', payload.eventType, payload);
    
    // Only process changes for the current user
    if (payload.new?.user_id !== user?.id && payload.old?.user_id !== user?.id) {
      return;
    }

    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new) {
          const newSprint: Sprint = {
            id: payload.new.id,
            user_id: payload.new.user_id,
            title: payload.new.title,
            icon: payload.new.icon,
            isBacklog: payload.new.is_backlog,
            isDraggable: payload.new.is_draggable,
            archivedAt: payload.new.archived_at,
            stories: []
          };
          
          setSprints(prev => {
            const exists = prev.find(s => s.id === newSprint.id);
            if (exists) return prev;
            return [...prev, newSprint].sort((a, b) => {
              const aPos = a.id === 'priority' ? 0 : a.id === 'development' ? 1 : 2;
              const bPos = b.id === 'priority' ? 0 : b.id === 'development' ? 1 : 2;
              return aPos - bPos;
            });
          });
        }
        break;
        
      case 'UPDATE':
        if (payload.new) {
          setSprints(prev => prev.map(sprint => 
            sprint.id === payload.new.id 
              ? {
                  ...sprint,
                  title: payload.new.title,
                  icon: payload.new.icon,
                  isBacklog: payload.new.is_backlog,
                  isDraggable: payload.new.is_draggable,
                  archivedAt: payload.new.archived_at
                }
              : sprint
          ));
        }
        break;
        
      case 'DELETE':
        if (payload.old) {
          setSprints(prev => prev.filter(sprint => sprint.id !== payload.old.id));
        }
        break;
    }
  }, [user?.id]);

  // Enhanced real-time story change handler
  const handleStoryChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    console.log('Story change detected:', payload.eventType, payload);
    
    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new) {
          const newStory: Story = {
            id: payload.new.id,
            number: payload.new.number,
            title: payload.new.title,
            description: payload.new.description || '',
            completed: payload.new.completed,
            date: payload.new.date,
            tags: payload.new.tags || [],
            completedAt: payload.new.completed_at,
            sprintId: payload.new.sprint_id,
            createdAt: payload.new.created_at,
            updatedAt: payload.new.updated_at,
            archivedAt: payload.new.archived_at
          };
          
          setSprints(prev => prev.map(sprint => 
            sprint.id === newStory.sprintId
              ? {
                  ...sprint,
                  stories: [...sprint.stories, newStory].sort((a, b) => {
                    const aPos = payload.new.position ?? 999;
                    const bPos = sprint.stories.find(s => s.id === b.id) ? 
                      sprint.stories.findIndex(s => s.id === b.id) : 999;
                    return aPos - bPos;
                  })
                }
              : sprint
          ));
        }
        break;
        
      case 'UPDATE':
        if (payload.new && payload.old) {
          const updatedStory: Story = {
            id: payload.new.id,
            number: payload.new.number,
            title: payload.new.title,
            description: payload.new.description || '',
            completed: payload.new.completed,
            date: payload.new.date,
            tags: payload.new.tags || [],
            completedAt: payload.new.completed_at,
            sprintId: payload.new.sprint_id,
            createdAt: payload.new.created_at,
            updatedAt: payload.new.updated_at,
            archivedAt: payload.new.archived_at
          };
          
          const oldSprintId = payload.old.sprint_id;
          const newSprintId = payload.new.sprint_id;
          
          setSprints(prev => {
            let updated = [...prev];
            
            // If story moved between sprints
            if (oldSprintId !== newSprintId) {
              // Remove from old sprint
              updated = updated.map(sprint => 
                sprint.id === oldSprintId
                  ? { ...sprint, stories: sprint.stories.filter(s => s.id !== updatedStory.id) }
                  : sprint
              );
              
              // Add to new sprint
              updated = updated.map(sprint => 
                sprint.id === newSprintId
                  ? { 
                      ...sprint, 
                      stories: [...sprint.stories, updatedStory].sort((a, b) => {
                        const aPos = a.id === updatedStory.id ? payload.new.position : 
                          sprint.stories.findIndex(s => s.id === a.id);
                        const bPos = b.id === updatedStory.id ? payload.new.position : 
                          sprint.stories.findIndex(s => s.id === b.id);
                        return aPos - bPos;
                      })
                    }
                  : sprint
              );
            } else {
              // Update story in same sprint
              updated = updated.map(sprint => 
                sprint.id === newSprintId
                  ? {
                      ...sprint,
                      stories: sprint.stories.map(story => 
                        story.id === updatedStory.id ? updatedStory : story
                      )
                    }
                  : sprint
              );
            }
            
            return updated;
          });
        }
        break;
        
      case 'DELETE':
        if (payload.old) {
          setSprints(prev => prev.map(sprint => ({
            ...sprint,
            stories: sprint.stories.filter(story => story.id !== payload.old.id)
          })));
        }
        break;
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isInitialized || !user) return;

    console.log('Setting up real-time subscriptions...');

    // Subscribe to sprint changes
    const sprintChannel = supabase
      .channel('sprints-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sprints',
          filter: `user_id=eq.${user.id}`
        },
        handleSprintChange
      )
      .subscribe((status) => {
        console.log('Sprint subscription status:', status);
      });

    // Subscribe to story changes
    const storyChannel = supabase
      .channel('stories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories'
        },
        handleStoryChange
      )
      .subscribe((status) => {
        console.log('Story subscription status:', status);
      });

    // Cleanup subscriptions on unmount
    return () => {
      console.log('Cleaning up real-time subscriptions...');
      supabase.removeChannel(sprintChannel);
      supabase.removeChannel(storyChannel);
    };
  }, [isInitialized, user?.id, handleSprintChange, handleStoryChange]);

  // Generate next story number
  const generateStoryNumber = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('stories')
        .select('number')
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].number.split('-')[1]);
        return `STORY-${String(lastNumber + 1).padStart(3, '0')}`;
      }

      return 'STORY-001';
    } catch (err) {
      console.error('Error generating story number:', err);
      return `STORY-${String(Date.now()).slice(-3)}`;
    }
  }, [user]);

  // Add new story
  const addStory = useCallback(async (sprintId: string, title: string, description: string, tags: string[]) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const operationId = `add-story-${Date.now()}`;
    setOperationLoadingState(operationId, true);

    try {
      const storyNumber = await generateStoryNumber();
      
      // Get the highest position in the sprint
      const { data: existingStories, error: positionError } = await supabase
        .from('stories')
        .select('position')
        .eq('sprint_id', sprintId)
        .is('archived_at', null)
        .order('position', { ascending: false })
        .limit(1);

      if (positionError) throw positionError;

      const nextPosition = existingStories && existingStories.length > 0 
        ? existingStories[0].position + 1 
        : 0;

      const newStory = {
        number: storyNumber,
        title,
        description: description || null,
        completed: false,
        date: new Date().toLocaleDateString('en-GB'),
        tags,
        sprint_id: sprintId,
        position: nextPosition
      };

      const { data, error } = await supabase
        .from('stories')
        .insert([newStory])
        .select()
        .single();

      if (error) throw error;

      console.log('Story added successfully:', data);
      
      // Real-time subscription will handle the update

      return data;
    } catch (err) {
      console.error('Error adding story:', err);
      setError(err instanceof Error ? err.message : 'Failed to add story');
      throw err;
    } finally {
      setOperationLoadingState(operationId, false);
    }
  }, [generateStoryNumber, user, setOperationLoadingState]);

  // Add new sprint
  const addSprint = useCallback(async (title: string, icon: string, description: string, isBacklog: boolean, isDraggable: boolean) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const operationId = `add-sprint-${Date.now()}`;
    setOperationLoadingState(operationId, true);

    try {
      // Get the highest position
      const { data: existingSprints, error: positionError } = await supabase
        .from('sprints')
        .select('position')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .order('position', { ascending: false })
        .limit(1);

      if (positionError) throw positionError;

      // Ensure new sprints start at position 1 or higher (Priority Sprint is always position 0)
      const nextPosition = existingSprints && existingSprints.length > 0 
        ? Math.max(existingSprints[0].position + 1, 1)
        : 1;

      // Generate a unique ID for the sprint
      const sprintId = `sprint-${Date.now()}`;

      const newSprint = {
        id: sprintId,
        title,
        description: description || null,
        icon,
        is_backlog: isBacklog,
        is_draggable: isDraggable,
        position: nextPosition,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('sprints')
        .insert([newSprint])
        .select()
        .single();

      if (error) throw error;

      console.log('Sprint added successfully:', data);
      
      // Real-time subscription will handle the update

      return data;
    } catch (err) {
      console.error('Error adding sprint:', err);
      setError(err instanceof Error ? err.message : 'Failed to add sprint');
      throw err;
    } finally {
      setOperationLoadingState(operationId, false);
    }
  }, [user, setOperationLoadingState]);

  // Enhanced toggle story with better error handling
  const toggleStory = useCallback(async (storyId: string) => {
    const operationId = `toggle-story-${storyId}`;
    setOperationLoadingState(operationId, true);

    try {
      console.log('Toggling story:', storyId);
      
      // First, try to find the story in local state
      let currentStory: Story | undefined;
      let currentSprint: Sprint | undefined;
      
      for (const sprint of sprints) {
        const story = sprint.stories.find(s => s.id === storyId);
        if (story) {
          currentStory = story;
          currentSprint = sprint;
          break;
        }
      }

      // If not found in local state, try to fetch from database
      if (!currentStory) {
        console.log('Story not found in local state, fetching from database...');
        const { data: dbStory, error: fetchError } = await supabase
          .from('stories')
          .select('*')
          .eq('id', storyId)
          .single();

        if (fetchError || !dbStory) {
          throw new Error(`Story not found: ${storyId}`);
        }

        currentStory = {
          id: dbStory.id,
          number: dbStory.number,
          title: dbStory.title,
          description: dbStory.description || '',
          completed: dbStory.completed,
          date: dbStory.date,
          tags: dbStory.tags || [],
          completedAt: dbStory.completed_at,
          sprintId: dbStory.sprint_id,
          createdAt: dbStory.created_at,
          updatedAt: dbStory.updated_at,
          archivedAt: dbStory.archived_at
        };
      }

      console.log('Found story:', currentStory.number, 'Current completed:', currentStory.completed);

      // Optimistic update
      const newCompletedState = !currentStory.completed;
      setSprints(prev => prev.map(sprint => ({
        ...sprint,
        stories: sprint.stories.map(story => 
          story.id === storyId 
            ? { ...story, completed: newCompletedState, completedAt: newCompletedState ? new Date().toISOString() : null }
            : story
        )
      })));

      // Update in database
      const { error: updateError } = await supabase
        .from('stories')
        .update({ 
          completed: newCompletedState,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId);

      if (updateError) {
        // Rollback optimistic update
        setSprints(prev => prev.map(sprint => ({
          ...sprint,
          stories: sprint.stories.map(story => 
            story.id === storyId 
              ? { ...story, completed: currentStory!.completed, completedAt: currentStory!.completedAt }
              : story
          )
        })));
        throw updateError;
      }

      console.log('Story toggled successfully:', storyId, 'New state:', newCompletedState);
    } catch (err) {
      console.error('Error toggling story:', err);
      setError(err instanceof Error ? err.message : 'Failed to update story');
      
      // Show user-friendly error message
      if (err instanceof Error && err.message.includes('not found')) {
        setError('Story not found. The page will refresh to sync with the latest data.');
        // Refresh data after a short delay
        setTimeout(() => {
          loadData();
          setError(null);
        }, 2000);
      }
    } finally {
      setOperationLoadingState(operationId, false);
    }
  }, [sprints, setOperationLoadingState, loadData]);

  // Move story between sprints or reorder within sprint
  const moveStory = useCallback(async (storyId: string, destinationSprintId: string, newPosition: number) => {
    if (!user) return;

    const operationId = `move-story-${storyId}`;
    setOperationLoadingState(operationId, true);

    try {
      // Get all stories from the database to ensure we have the latest state
      const { data: allStories, error: fetchError } = await supabase
        .from('stories')
        .select('*')
        .is('archived_at', null)
        .order('position');

      if (fetchError) throw fetchError;
      if (!allStories) throw new Error('Failed to fetch stories');

      // Find the story being moved
      const movedStory = allStories.find(story => story.id === storyId);
      if (!movedStory) throw new Error('Story not found');

      const sourceSprintId = movedStory.sprint_id;

      // Get stories for source and destination sprints
      const sourceSprintStories = allStories
        .filter(story => story.sprint_id === sourceSprintId && story.id !== storyId)
        .sort((a, b) => a.position - b.position);

      const destinationSprintStories = sourceSprintId === destinationSprintId
        ? sourceSprintStories // Same sprint, so we already filtered out the moved story
        : allStories
            .filter(story => story.sprint_id === destinationSprintId)
            .sort((a, b) => a.position - b.position);

      // Create arrays for the new arrangements
      const updatedStories: Array<{
        id: string;
        sprint_id: string;
        position: number;
        updated_at: string;
      }> = [];

      const now = new Date().toISOString();

      // Re-index source sprint stories (if different from destination)
      if (sourceSprintId !== destinationSprintId) {
        sourceSprintStories.forEach((story, index) => {
          updatedStories.push({
            id: story.id,
            sprint_id: sourceSprintId,
            position: index,
            updated_at: now
          });
        });
      }

      // Insert moved story at new position and re-index destination sprint
      const newDestinationStories = [...destinationSprintStories];
      newDestinationStories.splice(newPosition, 0, {
        ...movedStory,
        sprint_id: destinationSprintId
      });

      // Re-index all stories in destination sprint
      newDestinationStories.forEach((story, index) => {
        updatedStories.push({
          id: story.id,
          sprint_id: destinationSprintId,
          position: index,
          updated_at: now
        });
      });

      // Perform batch update using individual updates (Supabase doesn't support batch upsert easily)
      const updatePromises = updatedStories.map(update => 
        supabase
          .from('stories')
          .update({
            sprint_id: update.sprint_id,
            position: update.position,
            updated_at: update.updated_at
          })
          .eq('id', update.id)
      );

      const results = await Promise.all(updatePromises);
      
      // Check for any errors in the batch update
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} stories: ${errors[0].error?.message}`);
      }

      console.log('Story moved successfully');
    } catch (err) {
      console.error('Error moving story:', err);
      setError(err instanceof Error ? err.message : 'Failed to move story');
    } finally {
      setOperationLoadingState(operationId, false);
    }
  }, [user, setOperationLoadingState]);

  // Calculate sprint statistics
  const getSprintStats = useCallback((sprintId: string): SprintStats => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return { todo: 0, inProgress: 0, done: 0 };

    const completed = sprint.stories.filter(s => s.completed).length;
    const total = sprint.stories.length;
    
    return {
      todo: total - completed,
      inProgress: 0, // Will be dynamic in later sprints
      done: completed
    };
  }, [sprints]);

  // Handle sprint closing (archive functionality)
  const closeSprint = useCallback(async (sprintId: string, type: 'completed' | 'all') => {
    const operationId = `close-sprint-${sprintId}`;
    setOperationLoadingState(operationId, true);

    try {
      if (type === 'completed') {
        // Archive only completed stories
        await archiveCompletedStories(sprintId);
      } else {
        // Archive all stories in the sprint (but NOT the sprint itself)
        await archiveAllStoriesInSprint(sprintId);
      }
      
      // Reload data to reflect changes
      await loadData();
    } catch (err) {
      console.error('Error closing sprint:', err);
      setError(err instanceof Error ? err.message : 'Failed to close sprint');
    } finally {
      setOperationLoadingState(operationId, false);
    }
  }, [archiveAllStoriesInSprint, archiveCompletedStories, loadData, setOperationLoadingState]);

  // Initialize on mount
  useEffect(() => {
    if (user) {
      initializeData();
    }
  }, [user, initializeData]);

  return {
    sprints,
    loading,
    error,
    operationLoading,
    addStory,
    addSprint,
    toggleStory,
    moveStory,
    closeSprint,
    getSprintStats,
    refreshData: loadData
  };
};