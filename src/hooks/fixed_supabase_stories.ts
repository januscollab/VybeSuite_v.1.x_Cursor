// src/hooks/useSupabaseStories.ts - FIXED VERSION
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const backlogCreationRef = useRef(false);

  const { archiveAllStoriesInSprint, archiveCompletedStories } = useArchive();

  // FIXED: Simplified backlog sprint creation with better error handling
  const ensureBacklogSprintExists = useCallback(async () => {
    if (!user || backlogCreationRef.current) return;
    
    try {
      backlogCreationRef.current = true;
      
      // Check if backlog sprint exists
      const { data: existingBacklog, error: checkError } = await supabase
        .from('sprints')
        .select('id, archived_at, position')
        .eq('user_id', user.id)
        .eq('is_backlog', true)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw checkError;
      }

      if (existingBacklog) {
        // Unarchive if needed
        if (existingBacklog.archived_at) {
          const { error: unarchiveError } = await supabase
            .from('sprints')
            .update({ 
              archived_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingBacklog.id);

          if (unarchiveError) throw unarchiveError;
          console.log('✅ Backlog sprint unarchived');
        }
        
        // Fix position to be last
        await fixBacklogPosition();
        return;
      }

      // Create new backlog sprint
      await createBacklogSprint();
      
    } catch (err) {
      console.error('❌ Error ensuring backlog sprint exists:', err);
      // Don't throw - this shouldn't break the app
    } finally {
      backlogCreationRef.current = false;
    }
  }, [user]);

  // FIXED: Simplified backlog position fixing
  const fixBacklogPosition = useCallback(async () => {
    if (!user) return;

    try {
      // Get max position of non-backlog sprints
      const { data: maxPositionResult } = await supabase
        .from('sprints')
        .select('position')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .eq('is_backlog', false)
        .order('position', { ascending: false })
        .limit(1);

      const maxPosition = maxPositionResult?.[0]?.position || 0;
      const backlogPosition = maxPosition + 1;

      // Update backlog position
      const { error } = await supabase
        .from('sprints')
        .update({ 
          position: backlogPosition,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_backlog', true);

      if (error) throw error;
      console.log('✅ Backlog position fixed:', backlogPosition);
      
    } catch (err) {
      console.error('❌ Error fixing backlog position:', err);
    }
  }, [user]);

  // FIXED: Cleaner backlog creation
  const createBacklogSprint = useCallback(async () => {
    if (!user) return;

    const { data: maxPositionResult } = await supabase
      .from('sprints')
      .select('position')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = (maxPositionResult?.[0]?.position || 0) + 1;

    const { error } = await supabase
      .from('sprints')
      .insert({
        id: `backlog-${user.id}-${Date.now()}`, // Ensure uniqueness
        title: 'Backlog',
        description: 'Future enhancements and feature ideas',
        icon: '📋',
        is_backlog: true,
        is_draggable: false,
        user_id: user.id,
        position: nextPosition
      });

    if (error) {
      if (error.code === '23505') {
        console.log('⚠️ Backlog sprint already exists (race condition)');
        return;
      }
      throw error;
    }

    console.log('✅ Backlog sprint created successfully');
  }, [user]);

  // FIXED: Load data with better error handling and cache busting
  const loadData = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Clear any cached data if force refresh
      if (forceRefresh) {
        localStorage.removeItem(CACHE_KEY);
      }

      // Ensure backlog exists first
      await ensureBacklogSprintExists();

      // Fetch sprints with explicit ordering
      const { data: sprintsData, error: sprintsError } = await supabase
        .from('sprints')
        .select('*')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .order('position', { ascending: true });

      if (sprintsError) throw sprintsError;

      // Fetch stories
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .is('archived_at', null)
        .order('position', { ascending: true });

      if (storiesError) throw storiesError;

      // FIXED: Build sprints with stories and proper typing
      const sprintsWithStories: Sprint[] = (sprintsData || []).map(sprint => ({
        id: sprint.id,
        title: sprint.title,
        description: sprint.description || '',
        icon: sprint.icon,
        isBacklog: sprint.is_backlog || false,
        isDraggable: sprint.is_draggable !== false, // Default to true unless explicitly false
        position: sprint.position || 0,
        stories: (storiesData || [])
          .filter(story => story.sprint_id === sprint.id)
          .map(story => ({
            id: story.id,
            number: story.number,
            title: story.title,
            description: story.description || '',
            completed: story.completed || false,
            completedAt: story.completed_at,
            date: story.date,
            tags: story.tags || [],
            sprintId: story.sprint_id,
            createdAt: story.created_at,
            updatedAt: story.updated_at,
            archivedAt: story.archived_at
          }))
      }));
      
      // FIXED: Proper sprint sorting
      const sortedSprints = sprintsWithStories.sort((a, b) => {
        // Priority sprint always first
        if (a.id === 'priority') return -1;
        if (b.id === 'priority') return 1;
        
        // Backlog always last
        if (a.isBacklog && !b.isBacklog) return 1;
        if (!a.isBacklog && b.isBacklog) return -1;
        
        // Regular sprints by position
        return a.position - b.position;
      });

      setSprints(sortedSprints);
      setIsInitialized(true);
      
      console.log('✅ Data loaded successfully:', {
        sprintsCount: sortedSprints.length,
        backlogExists: sortedSprints.some(s => s.isBacklog),
        priorityExists: sortedSprints.some(s => s.id === 'priority')
      });
      
    } catch (err) {
      console.error('❌ Error loading data:', err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Missing Supabase configuration or network error. Please check your Supabase URL and API key.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  }, [user, ensureBacklogSprintExists]);

  // FIXED: Force refresh function for troubleshooting
  const forceRefresh = useCallback(() => {
    console.log('🔄 Force refreshing data...');
    loadData(true);
  }, [loadData]);

  // Add story with better error handling
  const addStory = useCallback(async (sprintId: string, storyData: { 
    title: string; 
    description?: string; 
    tags?: string[];
    priority?: string;
    risk?: string;
  }) => {
    if (!user || !userProfile) return;

    try {
      setOperationLoading(prev => ({ ...prev, [`add-story-${sprintId}`]: true }));

      // Generate story number
      const { data: existingStories } = await supabase
        .from('stories')
        .select('number')
        .order('created_at', { ascending: false })
        .limit(1);

      const lastNumber = existingStories?.[0]?.number || `${userProfile.storyPrefix}-000`;
      const numberMatch = lastNumber.match(/(\d+)$/);
      const nextNumber = numberMatch ? parseInt(numberMatch[1]) + 1 : 1;
      const paddedNumber = nextNumber.toString().padStart(3, '0');
      const storyNumber = `${userProfile.storyPrefix}-${paddedNumber}`;

      // Get next position in sprint
      const { data: sprintStories } = await supabase
        .from('stories')
        .select('position')
        .eq('sprint_id', sprintId)
        .is('archived_at', null)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = (sprintStories?.[0]?.position || 0) + 1;

      const { error } = await supabase
        .from('stories')
        .insert({
          number: storyNumber,
          title: storyData.title,
          description: storyData.description || '',
          tags: storyData.tags || [],
          sprint_id: sprintId,
          position: nextPosition,
          user_id: user.id,
          completed: false,
          date: new Date().toLocaleDateString('en-GB')
        });

      if (error) throw error;
      
      console.log('✅ Story added successfully:', storyNumber);
      await loadData(true); // Force refresh after adding
      
    } catch (err) {
      console.error('❌ Error adding story:', err);
      setError(err instanceof Error ? err.message : 'Failed to add story');
    } finally {
      setOperationLoading(prev => ({ ...prev, [`add-story-${sprintId}`]: false }));
    }
  }, [user, userProfile, loadData]);

  // Initialize data on mount and user change
  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setSprints([]);
      setIsInitialized(false);
    }
  }, [user, loadData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user || !isInitialized) return;

    const sprintsSubscription = supabase
      .channel('sprints_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sprints', filter: `user_id=eq.${user.id}` },
        () => {
          console.log('🔄 Sprints changed, refreshing...');
          loadData(true);
        }
      )
      .subscribe();

    const storiesSubscription = supabase
      .channel('stories_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'stories' },
        () => {
          console.log('🔄 Stories changed, refreshing...');
          loadData(true);
        }
      )
      .subscribe();

    return () => {
      sprintsSubscription.unsubscribe();
      storiesSubscription.unsubscribe();
    };
  }, [user, isInitialized, loadData]);

  return {
    sprints,
    loading,
    error,
    isInitialized,
    operationLoading,
    addStory,
    forceRefresh, // Export for debugging
    // ... other methods
  };
};