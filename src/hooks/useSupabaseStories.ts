import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Story, Sprint, SprintStats } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useUserSettings } from './useUserSettings';
import { useArchive } from './useArchive';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Cache management constants
const CACHE_KEY = 'sprint-board-cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const SYNC_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export const useSupabaseStories = () => {
  const { user } = useAuth();
  const { userProfile } = useUserSettings();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [operationLoading, setOperationLoading] = useState<Record<string, boolean>>({});

  const { archiveAllStoriesInSprint, archiveCompletedStories } = useArchive();

  // Ensure backlog sprint exists for the user
  const ensureBacklogSprintExists = useCallback(async () => {
    if (!user) return;

    try {
      // Check if backlog sprint already exists (including archived ones)
      const { data: existingBacklog, error: checkError } = await supabase
        .from('sprints')
        .select('id, archived_at')
        .eq('user_id', user.id)
        .eq('is_backlog', true)
        .limit(1);

      if (checkError) throw checkError;

      if (existingBacklog && existingBacklog.length > 0) {
        // If backlog exists but is archived, unarchive it
        if (existingBacklog[0].archived_at) {
          const { error: unarchiveError } = await supabase
            .from('sprints')
            .update({ 
              archived_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingBacklog[0].id);

          if (unarchiveError) throw unarchiveError;
          console.log('Backlog sprint unarchived successfully');
        }
        // If backlog exists and is not archived, do nothing
        return;
      } else {
        // If backlog doesn't exist, create it
        // Get the highest position to place backlog at the end
        const { data: allSprints } = await supabase
          .from('sprints')
          .select('position')
          .eq('user_id', user.id)
          .is('archived_at', null)
          .order('position', { ascending: false })
          .limit(1);

        const nextPosition = (allSprints?.[0]?.position || 0) + 1;

        const { error: createError } = await supabase
          .from('sprints')
          .insert({
            id: `backlog-${user.id}`,
            title: 'Backlog - Future Enhancements',
            description: 'Future enhancements and feature ideas',
            icon: '📋',
            is_backlog: true,
            is_draggable: false,
            user_id: user.id,
            position: nextPosition
          });

        if (createError) {
          // Handle duplicate key constraint specifically (error code 23505)
          if (createError.code === '23505') {
            console.warn('Backlog sprint already exists (race condition detected):', createError.message);
            // This is not critical - another process created the sprint
            return;
          } else {
            console.error('Error creating backlog sprint:', createError);
            // Don't throw here as this is not critical for app functionality
          }
        } else {
          console.log('Backlog sprint created successfully');
        }
      }
    } catch (err) {
      console.error('Error ensuring backlog sprint exists:', err);
      // Don't throw here as this is not critical for app functionality
    }
  }, [user]);

  // Load data from Supabase
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Ensure backlog sprint exists for this user
      await ensureBacklogSprintExists();

      // Fetch sprints
      const { data: sprintsData, error: sprintsError } = await supabase
        .from('sprints')
        .select('*')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .order('position');

      if (sprintsError) throw sprintsError;

      // Fetch stories for all sprints
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .is('archived_at', null)
        .order('position');

      if (storiesError) throw storiesError;

      // Group stories by sprint
      const sprintsWithStories = (sprintsData || []).map(sprint => ({
        ...sprint,
        stories: (storiesData || [])
          .filter(story => story.sprint_id === sprint.id)
          .map(story => ({
            id: story.id,
            number: story.number,
            title: story.title,
            description: story.description,
            completed: story.completed,
            completedAt: story.completed_at,
            date: story.date,
            tags: story.tags || [],
            sprintId: story.sprint_id,
            createdAt: story.created_at,
            updatedAt: story.updated_at,
            archivedAt: story.archived_at
          }))
      }));

      setSprints(sprintsWithStories);
      setIsInitialized(true);
    } catch (err) {
      console.error('Error loading data:', err);
      // Check for network/configuration errors
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Missing Supabase configuration or network error. Please check your Supabase URL and API key.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  }, [user, ensureBacklogSprintExists]);

  // Add a new story
  const addStory = useCallback(async (sprintId: string, storyData: { title: string; description?: string; tags?: string[] }) => {
    if (!user || !userProfile) return;

    const operationId = `add-story-${Date.now()}`;
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));

    try {
      // Generate unique story number with retry logic
      let newNumber: string;
      let attempts = 0;
      const maxAttempts = 5;
      
      do {
        const { data: lastStory, error: fetchError } = await supabase
          .from('stories')
          .select('number')
          .order('created_at', { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        let lastNumber = 0;
        if (lastStory?.[0]?.number) {
          // Extract numeric part from format like "PREFIX-001"
          const match = lastStory[0].number.match(/(\d+)$/);
          if (match) {
            lastNumber = parseInt(match[1], 10);
          }
        }
        
        // Add random offset to prevent collisions in concurrent requests
        const offset = attempts > 0 ? Math.floor(Math.random() * 10) + 1 : 1;
        
        // Use the story number prefix from user settings
        const prefix = userProfile.settings.storyNumberPrefix || 'STORY';
        newNumber = `${prefix}-${String(lastNumber + offset).padStart(3, '0')}`;
        
        // Check if this number already exists
        const { data: existingStory } = await supabase
          .from('stories')
          .select('id')
          .eq('number', newNumber)
          .limit(1);
        
        if (!existingStory || existingStory.length === 0) {
          break; // Number is unique, we can use it
        }
        
        attempts++;
      } while (attempts < maxAttempts);
      
      if (attempts >= maxAttempts) {
        // Fallback to timestamp-based number with user's prefix
        const prefix = userProfile.settings.storyNumberPrefix || 'STORY';
        newNumber = `${prefix}-${Date.now().toString().slice(-6)}`;
      }

      // Validate required fields
      if (!storyData.title || storyData.title.trim() === '') {
        throw new Error('Story title is required');
      }

      // Get next position in sprint
      const { data: lastStoryInSprint } = await supabase
        .from('stories')
        .select('position')
        .eq('sprint_id', sprintId)
        .is('archived_at', null)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = (lastStoryInSprint?.[0]?.position || 0) + 1;

      const { data, error } = await supabase
        .from('stories')
        .insert({
          number: newNumber,
          title: storyData.title,
          description: storyData.description || '',
          tags: storyData.tags || [],
          sprint_id: sprintId,
          date: new Date().toISOString().split('T')[0],
          position: nextPosition
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setSprints(prev => prev.map(sprint => 
        sprint.id === sprintId 
          ? {
              ...sprint,
              stories: [...sprint.stories, {
                id: data.id,
                number: data.number,
                title: data.title,
                description: data.description,
                completed: data.completed,
                completedAt: data.completed_at,
                date: data.date,
                tags: data.tags || [],
                sprintId: data.sprint_id,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                archivedAt: data.archived_at
              }]
            }
          : sprint
      ));
    } catch (err) {
      console.error('Error adding story:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add story';
      setError(errorMessage);
      
      // Show user-friendly error for common issues
      if (errorMessage.includes('duplicate key')) {
        setError('Story number conflict. Please try again.');
      } else if (errorMessage.includes('not-null constraint')) {
        setError('Missing required story information. Please check all fields.');
      }
    } finally {
      setOperationLoading(prev => {
        const { [operationId]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [user, userProfile]);

  // Update an existing story
  const updateStory = useCallback(async (storyId: string, storyData: { title: string; description?: string; tags?: string[] }) => {
    if (!user) return;

    const operationId = `update-story-${storyId}`;
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));

    try {
      // Validate required fields
      if (!storyData.title || storyData.title.trim() === '') {
        throw new Error('Story title is required');
      }

      const { data, error } = await supabase
        .from('stories')
        .update({
          title: storyData.title,
          description: storyData.description || '',
          tags: storyData.tags || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setSprints(prev => prev.map(sprint => ({
        ...sprint,
        stories: sprint.stories.map(story => 
          story.id === storyId 
            ? {
                ...story,
                title: data.title,
                description: data.description,
                tags: data.tags || [],
                updatedAt: data.updated_at
              }
            : story
        )
      })));
    } catch (err) {
      console.error('Error updating story:', err);
      setError(err instanceof Error ? err.message : 'Failed to update story');
    } finally {
      setOperationLoading(prev => {
        const { [operationId]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [user]);

  // Delete a story
  const deleteStory = useCallback(async (storyId: string) => {
    if (!user) return;

    const operationId = `delete-story-${storyId}`;
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));

    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;

      // Update local state
      setSprints(prev => prev.map(sprint => ({
        ...sprint,
        stories: sprint.stories.filter(story => story.id !== storyId)
      })));
    } catch (err) {
      console.error('Error deleting story:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete story');
    } finally {
      setOperationLoading(prev => {
        const { [operationId]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [user]);

  // Add a new sprint
  const addSprint = useCallback(async (title: string, icon: string, description: string, isBacklog: boolean, isDraggable: boolean) => {
    if (!user) return;

    // Prevent creating additional backlog sprints
    if (isBacklog) {
      console.warn('Cannot create additional backlog sprints - one already exists');
      setError('Only one backlog sprint is allowed per user');
      return;
    }

    const operationId = `add-sprint-${Date.now()}`;
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));

    try {
      // Get all sprints to determine correct positioning
      const { data: allSprints } = await supabase
        .from('sprints')
        .select('id, position, is_backlog')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .order('position', { ascending: false });

      let nextPosition: number;
      
      if (isBacklog) {
        // Backlog sprint should always be last
        nextPosition = (allSprints?.[0]?.position || 0) + 1;
      } else {
        // Find the backlog sprint position
        const backlogSprint = allSprints?.find(sprint => sprint.is_backlog);
        
        if (backlogSprint) {
          // Insert new sprint before the backlog
          nextPosition = backlogSprint.position;
          
          // Update backlog position to be after the new sprint
          const { error: updateError } = await supabase
            .from('sprints')
            .update({ position: nextPosition + 1 })
            .eq('id', backlogSprint.id);
            
          if (updateError) throw updateError;
        } else {
          // No backlog sprint exists, use next available position
          nextPosition = (allSprints?.[0]?.position || 0) + 1;
        }
      }

      const { data, error } = await supabase
        .from('sprints')
        .insert({
         id: crypto.randomUUID(),
          title,
          description: description || '',
          icon: icon || '📋',
          is_backlog: isBacklog,        // Ensure backlog flag is set correctly
          is_draggable: isBacklog ? false : isDraggable,  // Backlog sprints are never draggable
          user_id: user.id,
          position: nextPosition
        })
        .select()
        .single();

      if (error) throw error;

      // Reload data to get correct ordering
      await loadData();
    } catch (err) {
      console.error('Error adding sprint:', err);
      setError(err instanceof Error ? err.message : 'Failed to add sprint');
    } finally {
      setOperationLoading(prev => {
        const { [operationId]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [user, loadData]);

  // Move sprint position
  const moveSprint = useCallback(async (sprintId: string, newPosition: number) => {
    if (!user) return;
    
    // Prevent moving backlog sprint or priority sprint
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint || sprint.isBacklog || sprintId === 'priority') {
      console.warn('Cannot move system sprints (Priority or Backlog)');
      return;
    }

    const operationId = `move-sprint-${sprintId}`;
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));

    try {
      // Get all user sprints (excluding priority and backlog)
      const { data: userSprints, error: fetchError } = await supabase
        .from('sprints')
        .select('*')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .neq('id', 'priority')
        .eq('is_backlog', false)
        .order('position');

      if (fetchError) throw fetchError;
      if (!userSprints) throw new Error('Failed to fetch user sprints');

      // Find the sprint being moved
      const movedSprint = userSprints.find(s => s.id === sprintId);
      if (!movedSprint) throw new Error('Sprint not found or not moveable');

      // Remove the moved sprint from the array
      const otherSprints = userSprints.filter(s => s.id !== sprintId);

      // Insert the moved sprint at the new position
      otherSprints.splice(newPosition, 0, movedSprint);

      // Update positions for all user sprints (starting from position 1, after priority)
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

      // Reload data to get correct ordering
      await loadData();
    } catch (err) {
      console.error('Error moving sprint:', err);
      setError(err instanceof Error ? err.message : 'Failed to move sprint');
    } finally {
      setOperationLoading(prev => {
        const { [operationId]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [user, sprints, loadData]);

  // Delete sprint
  const deleteSprint = useCallback(async (sprintId: string) => {
    // Prevent deletion of backlog sprint
    const sprint = sprints.find(s => s.id === sprintId);
    if (sprint?.isBacklog) {
      console.warn('Cannot delete backlog sprint');
      setError('Backlog sprint cannot be deleted');
      return;
    }

    const operationId = `delete-sprint-${sprintId}`;
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));

    try {
      const { error } = await supabase
        .from('sprints')
        .delete()
        .eq('id', sprintId);

      if (error) throw error;

      // Update local state
      setSprints(prev => prev.filter(sprint => sprint.id !== sprintId));
    } catch (err) {
      console.error('Error deleting sprint:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete sprint');
    } finally {
      setOperationLoading(prev => {
        const { [operationId]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [sprints]);

  // Toggle story completion
  const toggleStory = useCallback(async (storyId: string) => {
    const operationId = `toggle-story-${storyId}`;
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));

    try {
      // Find current story state
      const currentStory = sprints
        .flatMap(sprint => sprint.stories)
        .find(story => story.id === storyId);

      if (!currentStory) throw new Error('Story not found');

      const newCompleted = !currentStory.completed;
      const completedAt = newCompleted ? new Date().toISOString() : null;

      const { error } = await supabase
        .from('stories')
        .update({ 
          completed: newCompleted,
          completed_at: completedAt
        })
        .eq('id', storyId);

      if (error) throw error;

      // Update local state
      setSprints(prev => prev.map(sprint => ({
        ...sprint,
        stories: sprint.stories.map(story => 
          story.id === storyId 
            ? { ...story, completed: newCompleted, completedAt }
            : story
        )
      })));
    } catch (err) {
      console.error('Error toggling story:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle story');
    } finally {
      setOperationLoading(prev => {
        const { [operationId]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [sprints]);

  // Move story between sprints
  const moveStory = useCallback(async (storyId: string, targetSprintId: string, newPosition?: number) => {
    const operationId = `move-story-${storyId}`;
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));

    try {
      // Get next position if not provided
      let position = newPosition;
      if (position === undefined) {
        const { data: lastStoryInSprint } = await supabase
          .from('stories')
          .select('position')
          .eq('sprint_id', targetSprintId)
          .is('archived_at', null)
          .order('position', { ascending: false })
          .limit(1);

        position = (lastStoryInSprint?.[0]?.position || 0) + 1;
      }

      const { error } = await supabase
        .from('stories')
        .update({ 
          sprint_id: targetSprintId,
          position
        })
        .eq('id', storyId);

      if (error) throw error;

      // Update local state
      setSprints(prev => {
        const story = prev
          .flatMap(sprint => sprint.stories)
          .find(s => s.id === storyId);

        if (!story) return prev;

        return prev.map(sprint => ({
          ...sprint,
          stories: sprint.id === targetSprintId
            ? [...sprint.stories.filter(s => s.id !== storyId), { ...story, sprintId: targetSprintId }]
            : sprint.stories.filter(s => s.id !== storyId)
        }));
      });
    } catch (err) {
      console.error('Error moving story:', err);
      setError(err instanceof Error ? err.message : 'Failed to move story');
    } finally {
      setOperationLoading(prev => {
        const { [operationId]: _, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  // Close sprint (archive all stories)
  const closeSprint = useCallback(async (sprintId: string, type: 'completed' | 'all') => {
    const operationId = `close-sprint-${sprintId}`;
    setOperationLoading(prev => ({ ...prev, [operationId]: true }));

    try {
      if (type === 'completed') {
        await archiveCompletedStories(sprintId);
      } else {
        await archiveAllStoriesInSprint(sprintId);
      }
      await loadData(); // Refresh data
    } catch (err) {
      console.error('Error closing sprint:', err);
      setError(err instanceof Error ? err.message : 'Failed to close sprint');
    } finally {
      setOperationLoading(prev => {
        const { [operationId]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [archiveAllStoriesInSprint, archiveCompletedStories, loadData]);

  // Get sprint statistics
  const getSprintStats = useCallback((sprintId: string): SprintStats => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) {
      return { todo: 0, inProgress: 0, done: 0 };
    }

    const total = sprint.stories.length;
    const completed = sprint.stories.filter(story => story.completed).length;

    return {
      todo: total - completed,
      inProgress: 0, // Will be dynamic in later sprints
      done: completed
    };
  }, [sprints]);

  // Load data on mount and user change
  useEffect(() => {
    if (user && !isInitialized) {
      // Ensure backlog exists before loading data
      loadData();
    }
  }, [user, isInitialized, loadData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user || !isInitialized) return;

    const storiesSubscription = supabase
      .channel('stories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories'
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Stories change received:', payload);
          loadData();
        }
      )
      .subscribe();

    const sprintsSubscription = supabase
      .channel('sprints-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sprints'
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Sprints change received:', payload);
          loadData();
        }
      )
      .subscribe();

    return () => {
      storiesSubscription.unsubscribe();
      sprintsSubscription.unsubscribe();
    };
  }, [user, isInitialized, loadData]);

  return {
    sprints,
    loading,
    error,
    operationLoading,
    addStory,
    updateStory,
    deleteStory,
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