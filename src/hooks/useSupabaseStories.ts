import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Story, Sprint, SprintStats } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useArchive } from './useArchive';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Cache management constants
const CACHE_KEY = 'sprint-board-cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const SYNC_THRESHOLD = 5 * 60 * 1000; // 5 minutes

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

  // Cache management functions
  const loadFromCache = useCallback(() => {
    if (!user) return false;
    
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { sprints: cachedSprints, timestamp, userId } = JSON.parse(cached);
        
        // Verify cache is for current user and not expired
        if (userId === user.id && Date.now() - timestamp < CACHE_DURATION) {
          setSprints(cachedSprints);
          setLoading(false);
          console.log('⚡ Loaded from cache instantly');
          return true;
        }
      }
    } catch (error) {
      console.error('Cache load failed:', error);
      localStorage.removeItem(CACHE_KEY);
    }
    return false;
  }, [user]);

  const saveToCache = useCallback((sprintsData: Sprint[]) => {
    if (!user || sprintsData.length === 0) return;
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        sprints: sprintsData,
        timestamp: Date.now(),
        userId: user.id
      }));
    } catch (error) {
      console.error('Cache save failed:', error);
    }
  }, [user]);

  // Initialize data - create default sprints if they don't exist
  const initializeData = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      // Try to load from cache first for instant UI
      const cacheLoaded = loadFromCache();
      
      setLoading(true);
      setError(null);

      // Ensure default sprints exist with correct properties using upsert
      const defaultSprints = [
        {
          id: 'priority',
          title: 'Priority Sprint',
          icon: '🔥',
          is_backlog: false,
          is_draggable: false,
          position: 0,
          user_id: user.id,
          archived_at: null // Ensure it's not archived
        },
        {
          id: 'development',
          title: 'Development Sprint',
          icon: '⚡',
          is_backlog: false,
          is_draggable: true,
          position: 1,
          user_id: user.id,
          archived_at: null // Ensure it's not archived
        },
        {
          id: 'backlog',
          title: 'Backlog - Future Enhancements',
          icon: '📋',
          is_backlog: true,
          is_draggable: false,
          position: 2,
          user_id: user.id,
          archived_at: null // Ensure it's not archived
        }
      ];

      const { error: upsertError } = await supabase
        .from('sprints')
        .upsert(defaultSprints, { onConflict: 'id' });

      if (upsertError) throw upsertError;

      // Load all data
      await loadData();
      setIsInitialized(true);
      
      // If we didn't load from cache, we're done loading now
      if (!cacheLoaded) {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error initializing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize data');
    } finally {
      if (!loadFromCache()) {
        setLoading(false);
      }
    }
  }, [user, loadFromCache, loadData]);

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
      saveToCache(transformedSprints);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
  }, [user, saveToCache]);

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
            saveToCache(updated);
            return updated;
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
            
            saveToCache(updated);
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
  }, [saveToCache]);

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
        if (status === 'SUBSCRIBED') {
          console.log('✅ Sprint subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Sprint subscription error');
        }
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
        if (status === 'SUBSCRIBED') {
          console.log('✅ Story subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Story subscription error');
        }
      });

    // Cleanup subscriptions on unmount
    return () => {
      console.log('Cleaning up real-time subscriptions...');
      supabase.removeChannel(sprintChannel);
      supabase.removeChannel(storyChannel);
    };
  }, [isInitialized, user?.id, handleSprintChange, handleStoryChange]);

  // Smart page visibility handling
  useEffect(() => {
    if (!user) return;

    let isTabActive = true;
    let lastSyncTime = Date.now();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isTabActive = false;
      } else {
        isTabActive = true;
        const now = Date.now();
        
        // Only sync if tab was inactive for more than sync threshold
        if (now - lastSyncTime > SYNC_THRESHOLD) {
          console.log('🔄 Syncing after extended tab inactivity');
          loadData();
          lastSyncTime = now;
        }
      }
    };

    const handleFocus = () => {
      if (!isTabActive) {
        isTabActive = true;
        const now = Date.now();
        
        // Only sync if there might be changes (after extended inactivity)
        if (now - lastSyncTime > SYNC_THRESHOLD) {
          console.log('🔄 Syncing after extended inactivity');
          loadData();
          lastSyncTime = now;
        }
      }
    };

    const handleBlur = () => {
      isTabActive = false;
    };

    // Use visibility API for better detection
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [user, loadData]);

  // Cache sprints whenever they change
  useEffect(() => {
    if (sprints.length > 0 && user) {
      saveToCache(sprints);
    }
  }, [sprints, user, saveToCache]);

  // Generate next story number
  const generateStoryNumber = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('stories')
        .select('number')
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

  // Move sprint to new position
  const moveSprint = useCallback(async (sprintId: string, newPosition: number) => {
    if (!user) return;

    const operationId = `move-sprint-${sprintId}`;
    setOperationLoadingState(operationId, true);

    try {
      // Get all sprints from the database to ensure we have the latest state
      const { data: allSprints, error: fetchError } = await supabase
        .from('sprints')
        .select('*')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .order('position');

      if (fetchError) throw fetchError;
      if (!allSprints) throw new Error('Failed to fetch sprints');

      // Filter out priority and backlog sprints from reordering
      const reorderableSprints = allSprints.filter(sprint => 
        sprint.id !== 'priority' && !sprint.is_backlog
      );

      // Find the sprint being moved
      const movedSprint = reorderableSprints.find(sprint => sprint.id === sprintId);
      if (!movedSprint) throw new Error('Sprint not found or not reorderable');

      // Remove the moved sprint from the array
      const otherSprints = reorderableSprints.filter(sprint => sprint.id !== sprintId);

      // Insert the moved sprint at the new position
      otherSprints.splice(newPosition, 0, movedSprint);

      // Update positions for all reorderable sprints (starting from position 1)
      const updatePromises = otherSprints.map((sprint, index) => 
        supabase
          .from('sprints')
          .update({
            position: index + 1, // Start from position 1 (priority is always 0)
            updated_at: new Date().toISOString()
          })
          .eq('id', sprint.id)
      );

      const results = await Promise.all(updatePromises);
      
      // Check for any errors in the batch update
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} sprints: ${errors[0].error?.message}`);
      }

      console.log('Sprint moved successfully');
    } catch (err) {
      console.error('Error moving sprint:', err);
      setError(err instanceof Error ? err.message : 'Failed to move sprint');
    } finally {
      setOperationLoadingState(operationId, false);
    }
  }, [user, setOperationLoadingState]);

  // Delete sprint
  const deleteSprint = useCallback(async (sprintId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Prevent deletion of system sprints
    if (sprintId === 'priority' || sprintId === 'backlog') {
      throw new Error('System sprints cannot be deleted');
    }

    const operationId = `delete-sprint-${sprintId}`;
    setOperationLoadingState(operationId, true);

    try {
      // First, check if sprint has any stories
      const { data: stories, error: storiesError } = await supabase
        .from('stories')
        .select('id')
        .eq('sprint_id', sprintId)
        .is('archived_at', null);

      if (storiesError) throw storiesError;

      if (stories && stories.length > 0) {
        throw new Error('Cannot delete sprint with active stories. Please move or archive all stories first.');
      }

      // Delete the sprint
      const { error } = await supabase
        .from('sprints')
        .delete()
        .eq('id', sprintId)
        .eq('user_id', user.id);

      if (error) throw error;

      console.log('Sprint deleted successfully:', sprintId);
      
      // Real-time subscription will handle the update

      return true;
    } catch (err) {
      console.error('Error deleting sprint:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete sprint');
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

      // 1. ✅ OPTIMISTIC UPDATE: Update UI immediately
      setSprints(prev => prev.map(sprint => ({
        ...sprint,
        stories: sprint.stories.map(story => 
          story.id === storyId 
            ? { 
                ...story, 
                completed: newCompletedState, 
                completedAt: newCompletedState ? now : null,
                updatedAt: now
              }
            : story
        )
      })));

      // 2. ✅ DATABASE UPDATE: Sync with database
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
          completed_at: newCompletedState ? now : null,
          updated_at: now
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} stories: ${errors[0].error?.message}`);
      }

        // 3. ✅ ROLLBACK: Revert optimistic update on failure
        setSprints(prev => prev.map(sprint => ({
          ...sprint,
          stories: sprint.stories.map(story => 
            story.id === storyId 
              ? { 
                  ...story, 
                  completed: currentStory!.completed, 
                  completedAt: currentStory!.completedAt,
                  updatedAt: currentStory!.updatedAt
                }
              : story
          )
        })));
      console.log('Story moved successfully');
    } catch (err) {
      console.error('Error moving story:', err);
      setError(err instanceof Error ? err.message : 'Failed to move story');
    } finally {
      setOperationLoadingState(operationId, false);
    }
    return {
      todo: total - completed,
      inProgress: 0, // Will be dynamic in later sprints
  }, [sprints, setOperationLoadingState]);
    };
  }, [sprints]);

  // Handle sprint closing (archive functionality)
  const closeSprint = useCallback(async (sprintId: string, type: 'completed' | 'all') => {
    const operationId = `close-sprint-${sprintId}`;
    setOperationLoadingState(operationId, true);

    // Store original state for rollback
    let originalStory: Story | null = null;
    let originalSprintId: string | null = null;

    try {
      // 1. ✅ OPTIMISTIC UPDATE: Update UI immediately
      setSprints(prevSprints => {
        const newSprints = prevSprints.map(sprint => {
          // Find and remove the story from its current sprint
          const storyIndex = sprint.stories.findIndex(s => s.id === storyId);
          if (storyIndex !== -1) {
            originalStory = sprint.stories[storyIndex];
            originalSprintId = sprint.id;
            return {
              ...sprint,
              stories: sprint.stories.filter(s => s.id !== storyId)
            };
          }
          return sprint;
        });

        // Add story to destination sprint at correct position
        if (originalStory) {
          return newSprints.map(sprint => {
            if (sprint.id === destinationSprintId) {
              const newStories = [...sprint.stories];
              newStories.splice(newPosition, 0, { 
                ...originalStory, 
                sprintId: destinationSprintId,
                updatedAt: new Date().toISOString()
              });
              return { ...sprint, stories: newStories };
            }
            return sprint;
          });
        }
        return newSprints;
      });

      // 2. ✅ DATABASE UPDATE: Sync with database
      if (type === 'completed') {
        // Archive only completed stories
        await archiveCompletedStories(sprintId);
      } else {
        // Archive all stories in the sprint (but NOT the sprint itself)
        await archiveAllStoriesInSprint(sprintId);
      }
      
      // Reload data to reflect changes
      console.log('Story moved successfully:', storyId, 'to sprint:', destinationSprintId);
    } catch (err) {
      console.error('Error closing sprint:', err);
      
      // 3. ✅ ROLLBACK: Revert optimistic update on failure
      if (originalStory && originalSprintId) {
        setSprints(prevSprints => {
          const revertedSprints = prevSprints.map(sprint => {
            // Remove from destination sprint
            if (sprint.id === destinationSprintId) {
              return {
                ...sprint,
                stories: sprint.stories.filter(s => s.id !== storyId)
              };
            }
            // Add back to source sprint
            if (sprint.id === originalSprintId) {
              return {
                ...sprint,
                stories: [...sprint.stories, originalStory].sort((a, b) => 
                  a.number.localeCompare(b.number)
                )
              };
            }
            return sprint;
          });
          return revertedSprints;
        });
      }
      
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
    moveSprint,
    deleteSprint,
    toggleStory,
    moveStory,
    closeSprint,
    getSprintStats,
    refreshData: loadData
  };
};