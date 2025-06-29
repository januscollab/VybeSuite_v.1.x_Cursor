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

  // Get sprint statistics
  const getSprintStats = useCallback((sprint: Sprint): SprintStats => {
    const total = sprint.stories.length;
    const completed = sprint.stories.filter(story => story.completed).length;

    return {
      todo: total - completed,
      inProgress: 0, // Will be dynamic in later sprints
      completed,
      total
    };
  }, []);

  // Rest of the code...

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