import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Story, Sprint, ArchiveStats } from '../types';

export const useArchive = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Archive a sprint and optionally its stories
  const archiveSprint = useCallback(async (sprintId: string, archiveStories: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      // Archive the sprint
      const { error: sprintError } = await supabase
        .from('sprints')
        .update({ 
          archived_at: now,
          updated_at: now 
        })
        .eq('id', sprintId);

      if (sprintError) throw sprintError;

      // Optionally archive all stories in the sprint
      if (archiveStories) {
        const { error: storiesError } = await supabase
          .from('stories')
          .update({ 
            archived_at: now,
            updated_at: now 
          })
          .eq('sprint_id', sprintId)
          .is('archived_at', null);

        if (storiesError) throw storiesError;
      }

      return true;
    } catch (err) {
      console.error('Error archiving sprint:', err);
      setError(err instanceof Error ? err.message : 'Failed to archive sprint');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Archive completed stories in a sprint
  const archiveCompletedStories = useCallback(async (sprintId: string) => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      const { error } = await supabase
        .from('stories')
        .update({ 
          archived_at: now,
          updated_at: now 
        })
        .eq('sprint_id', sprintId)
        .eq('completed', true)
        .is('archived_at', null);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error archiving completed stories:', err);
      setError(err instanceof Error ? err.message : 'Failed to archive completed stories');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Archive individual stories
  const archiveStories = useCallback(async (storyIds: string[]) => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      const { error } = await supabase
        .from('stories')
        .update({ 
          archived_at: now,
          updated_at: now 
        })
        .in('id', storyIds)
        .is('archived_at', null);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error archiving stories:', err);
      setError(err instanceof Error ? err.message : 'Failed to archive stories');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Restore sprint from archive
  const restoreSprint = useCallback(async (sprintId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('sprints')
        .update({ 
          archived_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', sprintId);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error restoring sprint:', err);
      setError(err instanceof Error ? err.message : 'Failed to restore sprint');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Restore stories from archive
  const restoreStories = useCallback(async (storyIds: string[]) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('stories')
        .update({ 
          archived_at: null,
          updated_at: new Date().toISOString()
        })
        .in('id', storyIds);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error restoring stories:', err);
      setError(err instanceof Error ? err.message : 'Failed to restore stories');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get archive statistics
  const getArchiveStats = useCallback(async (): Promise<ArchiveStats | null> => {
    try {
      setLoading(true);
      setError(null);

      // Get story counts
      const { data: storyStats, error: storyError } = await supabase
        .from('stories')
        .select('completed, archived_at');

      if (storyError) throw storyError;

      // Get sprint counts
      const { data: sprintStats, error: sprintError } = await supabase
        .from('sprints')
        .select('archived_at');

      if (sprintError) throw sprintError;

      const totalStories = storyStats?.length || 0;
      const completedStories = storyStats?.filter(s => s.completed).length || 0;
      const archivedStories = storyStats?.filter(s => s.archived_at).length || 0;
      const totalSprints = sprintStats?.length || 0;
      const archivedSprints = sprintStats?.filter(s => s.archived_at).length || 0;

      return {
        totalStories,
        completedStories,
        totalSprints,
        archivedStories,
        archivedSprints
      };
    } catch (err) {
      console.error('Error getting archive stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to get archive statistics');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load archived sprints and stories
  const loadArchivedData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load archived sprints
      const { data: archivedSprints, error: sprintsError } = await supabase
        .from('sprints')
        .select('*')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (sprintsError) throw sprintsError;

      // Load archived stories
      const { data: allArchivedStories, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (storiesError) throw storiesError;

      // Return all archived stories as a flat array
      const allStories: Story[] = (allArchivedStories || [])
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
          updatedAt: story.updated_at,
          archivedAt: story.archived_at
        }));

      return {
        sprints: [], // No longer displaying sprints in archive
        orphanedStories: allStories
      };
    } catch (err) {
      console.error('Error loading archived data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load archived data');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    archiveSprint,
    archiveCompletedStories,
    archiveStories,
    restoreSprint,
    restoreStories,
    getArchiveStats,
    loadArchivedData
  };
};