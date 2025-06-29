import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BulkAction } from '../types';

export const useBulkActions = () => {
  const [selectedStories, setSelectedStories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toggle story selection
  const toggleStorySelection = useCallback((storyId: string) => {
    setSelectedStories(prev => 
      prev.includes(storyId)
        ? prev.filter(id => id !== storyId)
        : [...prev, storyId]
    );
  }, []);

  // Select all stories
  const selectAllStories = useCallback((storyIds: string[]) => {
    setSelectedStories(storyIds);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedStories([]);
  }, []);

  // Execute bulk action
  const executeBulkAction = useCallback(async (action: BulkAction) => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      switch (action.type) {
        case 'archive':
          const { error: archiveError } = await supabase
            .from('stories')
            .update({ 
              archived_at: now,
              updated_at: now 
            })
            .in('id', action.storyIds)
            .is('archived_at', null);

          if (archiveError) throw archiveError;
          break;

        case 'restore':
          const { error: restoreError } = await supabase
            .from('stories')
            .update({ 
              archived_at: null,
              updated_at: now 
            })
            .in('id', action.storyIds);

          if (restoreError) throw restoreError;
          break;

        case 'delete':
          const { error: deleteError } = await supabase
            .from('stories')
            .delete()
            .in('id', action.storyIds);

          if (deleteError) throw deleteError;
          break;

        case 'move':
          if (!action.targetSprintId) {
            throw new Error('Target sprint ID is required for move action');
          }

          // Get the highest position in the target sprint
          const { data: existingStories, error: positionError } = await supabase
            .from('stories')
            .select('position')
            .eq('sprint_id', action.targetSprintId)
            .order('position', { ascending: false })
            .limit(1);

          if (positionError) throw positionError;

          const startPosition = existingStories && existingStories.length > 0 
            ? existingStories[0].position + 1 
            : 0;

          // Move stories to target sprint
          const movePromises = action.storyIds.map((storyId, index) => 
            supabase
              .from('stories')
              .update({
                sprint_id: action.targetSprintId,
                position: startPosition + index,
                updated_at: now
              })
              .eq('id', storyId)
          );

          const moveResults = await Promise.all(movePromises);
          const moveErrors = moveResults.filter(result => result.error);
          
          if (moveErrors.length > 0) {
            throw new Error(`Failed to move ${moveErrors.length} stories`);
          }
          break;

        case 'tag':
          if (!action.tags || action.tags.length === 0) {
            throw new Error('Tags are required for tag action');
          }

          // Get current tags for each story and merge with new tags
          const { data: currentStories, error: fetchError } = await supabase
            .from('stories')
            .select('id, tags')
            .in('id', action.storyIds);

          if (fetchError) throw fetchError;

          const tagPromises = currentStories?.map(story => {
            const currentTags = story.tags || [];
            const newTags = [...new Set([...currentTags, ...action.tags!])];
            
            return supabase
              .from('stories')
              .update({
                tags: newTags,
                updated_at: now
              })
              .eq('id', story.id);
          }) || [];

          const tagResults = await Promise.all(tagPromises);
          const tagErrors = tagResults.filter(result => result.error);
          
          if (tagErrors.length > 0) {
            throw new Error(`Failed to tag ${tagErrors.length} stories`);
          }
          break;

        default:
          throw new Error(`Unknown bulk action: ${action.type}`);
      }

      // Clear selection after successful action
      clearSelection();
      return true;
    } catch (err) {
      console.error('Error executing bulk action:', err);
      setError(err instanceof Error ? err.message : 'Bulk action failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [clearSelection]);

  return {
    selectedStories,
    loading,
    error,
    toggleStorySelection,
    selectAllStories,
    clearSelection,
    executeBulkAction
  };
};