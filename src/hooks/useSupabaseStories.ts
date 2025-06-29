import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Story, Sprint, SprintStats } from '../types';

export const useSupabaseStories = () => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize data - create default sprints if they don't exist
  const initializeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if sprints exist
      const { data: existingSprints, error: sprintsError } = await supabase
        .from('sprints')
        .select('*')
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
            position: 0
          },
          {
            id: 'development',
            title: 'Development Sprint',
            icon: '⚡',
            is_backlog: false,
            is_draggable: true,
            position: 1
          },
          {
            id: 'backlog',
            title: 'Backlog - Future Enhancements',
            icon: '📋',
            is_backlog: true,
            is_draggable: false,
            position: 2
          }
        ];

        const { error: upsertError } = await supabase
          .from('sprints')
          .upsert(defaultSprints, { onConflict: 'id' });

        if (upsertError) throw upsertError;
      }

      // Load all data
      await loadData();
    } catch (err) {
      console.error('Error initializing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load sprints and stories from Supabase
  const loadData = useCallback(async () => {
    try {
      // Load sprints
      const { data: sprintsData, error: sprintsError } = await supabase
        .from('sprints')
        .select('*')
        .order('position');

      if (sprintsError) throw sprintsError;

      // Load stories
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .order('position');

      if (storiesError) throw storiesError;

      // Transform and combine data
      const transformedSprints: Sprint[] = (sprintsData || []).map(sprint => ({
        id: sprint.id,
        title: sprint.title,
        icon: sprint.icon,
        isBacklog: sprint.is_backlog,
        isDraggable: sprint.is_draggable,
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
            sprintId: story.sprint_id,
            createdAt: story.created_at,
            updatedAt: story.updated_at
          }))
      }));

      setSprints(transformedSprints);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
  }, []);

  // Generate next story number
  const generateStoryNumber = useCallback(async () => {
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
  }, []);

  // Add new story
  const addStory = useCallback(async (sprintId: string, title: string, description: string, tags: string[]) => {
    try {
      const storyNumber = await generateStoryNumber();
      
      // Get the highest position in the sprint
      const { data: existingStories, error: positionError } = await supabase
        .from('stories')
        .select('position')
        .eq('sprint_id', sprintId)
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

      // Reload data to reflect changes
      await loadData();

      return data;
    } catch (err) {
      console.error('Error adding story:', err);
      setError(err instanceof Error ? err.message : 'Failed to add story');
      throw err;
    }
  }, [generateStoryNumber, loadData]);

  // Toggle story completion
  const toggleStory = useCallback(async (storyId: string) => {
    try {
      // Get current story state
      const { data: currentStory, error: fetchError } = await supabase
        .from('stories')
        .select('completed')
        .eq('id', storyId)
        .single();

      if (fetchError) throw fetchError;

      // Update story
      const { error: updateError } = await supabase
        .from('stories')
        .update({ 
          completed: !currentStory.completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId);

      if (updateError) throw updateError;

      // Reload data to reflect changes
      await loadData();
    } catch (err) {
      console.error('Error toggling story:', err);
      setError(err instanceof Error ? err.message : 'Failed to update story');
    }
  }, [loadData]);

  // Move story between sprints or reorder within sprint
  const moveStory = useCallback(async (storyId: string, destinationSprintId: string, newPosition: number) => {
    try {
      // Get all stories from the database to ensure we have the latest state
      const { data: allStories, error: fetchError } = await supabase
        .from('stories')
        .select('*')
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

      // Reload data to reflect changes
      await loadData();
    } catch (err) {
      console.error('Error moving story:', err);
      setError(err instanceof Error ? err.message : 'Failed to move story');
    }
  }, [loadData]);

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

  // Initialize on mount
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  return {
    sprints,
    loading,
    error,
    addStory,
    toggleStory,
    moveStory,
    getSprintStats,
    refreshData: loadData
  };
};