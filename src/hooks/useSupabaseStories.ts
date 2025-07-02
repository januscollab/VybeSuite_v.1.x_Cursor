import { debug } from '../utils/debug';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Story, Sprint, SprintStats } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useUserSettings } from './useUserSettings';
import { useArchive } from './useArchive';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
// VERBOSE_LOGGING: Set to true only when debugging specific issues
const VERBOSE_LOGGING = false;
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
        if (!user || backlogCreationRef.current)
            return;
        try {
            backlogCreationRef.current = true;
            // Check if backlog sprint exists
            const { data: existingBacklogs, error: checkError } = await supabase
                .from('sprints')
                .select('id, archived_at, position')
                .eq('user_id', user.id)
                .eq('is_backlog', true)
                .limit(1);
            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
                throw checkError;
            }
            const existingBacklog = existingBacklogs?.[0];
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
                    if (unarchiveError)
                        throw unarchiveError;
                    debug.info("useSupabaseStories.ts", '✅ Backlog sprint unarchived');
                }
                // Fix position to be last
                await fixBacklogPosition();
                return;
            }
            // Create new backlog sprint
            await createBacklogSprint();
        }
        catch (err) {
            debug.error("useSupabaseStories.ts", "❌ Error ensuring backlog sprint exists", { err });
            // Don't throw - this shouldn't break the app
        }
        finally {
            backlogCreationRef.current = false;
        }
    }, [user]);
    // CRITICAL: Ensure Priority Sprint exists for ALL users
    const ensurePrioritySprintExists = useCallback(async () => {
        if (!user)
            return;
        try {
            // Check if priority sprint exists
            const { data: existingPriority, error: checkError } = await supabase
                .from('sprints')
                .select('id, archived_at')
                .eq('user_id', user.id)
                .eq('id', 'priority')
                .limit(1);
            if (checkError && (checkError as any).code !== 'PGRST116') { // PGRST116 = no rows found
                throw checkError;
            }
            const existingPrioritySprint = existingPriority?.[0];
            if (existingPrioritySprint) {
                // Unarchive if needed
                if (existingPrioritySprint.archived_at) {
                    const { error: unarchiveError } = await supabase
                        .from('sprints')
                        .update({
                        archived_at: null,
                        updated_at: new Date().toISOString()
                    })
                        .eq('id', 'priority')
                        .eq('user_id', user.id);
                    if (unarchiveError)
                        throw unarchiveError;
                    debug.info("useSupabaseStories.ts", '✅ Priority sprint unarchived');
                }
                return;
            }
            // Create new priority sprint
            await createPrioritySprintForUser();
        }
        catch (err) {
            debug.error("useSupabaseStories.ts", "❌ Error ensuring priority sprint exists", { err });
            // Don't throw - this shouldn't break the app
        }
    }, [user]);
    // CRITICAL: Create Priority Sprint with proper configuration (NEVER deletable)
    const createPrioritySprintForUser = useCallback(async () => {
        if (!user)
            return;
        try {
            const { error } = await supabase
                .from('sprints')
                .insert({
                id: 'priority', // FIXED ID for Priority Sprint
                title: 'Priority Sprint',
                description: 'High-priority tasks and urgent items',
                icon: '🔥',
                is_backlog: false,
                is_draggable: false, // CRITICAL: Priority Sprint is NEVER draggable
                user_id: user.id,
                position: 0 // CRITICAL: Priority Sprint is always first
            });
            if (error) {
                if ((error as any).code === '23505') {
                    debug.info("useSupabaseStories.ts", '⚠️ Priority sprint already exists (race condition)');
                    return;
                }
                throw error;
            }
            debug.info("useSupabaseStories.ts", '✅ Priority sprint created successfully for new user');
        }
        catch (err) {
            debug.error("useSupabaseStories.ts", "❌ Error creating priority sprint", { err });
            throw err;
        }
    }, [user]);
    // FIXED: Simplified backlog position fixing
    const fixBacklogPosition = useCallback(async () => {
        if (!user)
            return;
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
            if (error)
                throw error;
            if (VERBOSE_LOGGING) {
                debug.info("useSupabaseStories.ts", "✅ Backlog position fixed", { backlogPosition  });
            }
        }
        catch (err) {
            debug.error("useSupabaseStories.ts", "❌ Error fixing backlog position", { err });
        }
    }, [user]);
    // FIXED: Cleaner backlog creation
    const createBacklogSprint = useCallback(async () => {
        if (!user)
            return;
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
            id: `backlog-${user.id}`, // FIXED: Remove timestamp to prevent duplicates
            title: 'Backlog',
            description: 'Future enhancements and feature ideas',
            icon: '📋',
            is_backlog: true,
            is_draggable: false,
            user_id: user.id,
            position: nextPosition
        });
        if (error) {
            if ((error as any).code === '23505') {
                debug.info("useSupabaseStories.ts", '⚠️ Backlog sprint already exists (race condition)');
                return;
            }
            throw error;
        }
        debug.info("useSupabaseStories.ts", '✅ Backlog sprint created successfully');
    }, [user]);
    // FIXED: Load data with better error handling and cache busting
    const loadData = useCallback(async (forceRefresh = false) => {
        if (!user)
            return;
        try {
            setLoading(true);
            setError(null);
            // Clear any cached data if force refresh
            if (forceRefresh) {
                localStorage.removeItem(CACHE_KEY);
            }
            // CRITICAL: Ensure both Priority and Backlog sprints exist for ALL users
            // Priority sprint must be created first (position 0)
            await ensurePrioritySprintExists();
            await ensureBacklogSprintExists();
            // Fetch sprints with explicit ordering
            const { data: sprintsData, error: sprintsError } = await supabase
                .from('sprints')
                .select('*')
                .eq('user_id', user.id)
                .is('archived_at', null)
                .order('position', { ascending: true });
            if (sprintsError)
                throw sprintsError;
            // Fetch stories
            const { data: storiesData, error: storiesError } = await supabase
                .from('stories')
                .select('*')
                .is('archived_at', null)
                .order('position', { ascending: true });
            if (storiesError)
                throw storiesError;
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
                if (a.id === 'priority')
                    return -1;
                if (b.id === 'priority')
                    return 1;
                // Backlog always last
                if (a.isBacklog && !b.isBacklog)
                    return 1;
                if (!a.isBacklog && b.isBacklog)
                    return -1;
                // Regular sprints by position
                return a.position - b.position;
            });
            setSprints(sortedSprints);
            setIsInitialized(true);
            if (VERBOSE_LOGGING) {
                debug.info("useSupabaseStories.ts", "✅ Data loaded successfully", { 
                    sprintsCount: sortedSprints.length, 
                    backlogExists: sortedSprints.some(s => s.isBacklog),
                    priorityExists: sortedSprints.some(s => s.id === 'priority')
                });
            }
        }
        catch (err) {
            debug.error("useSupabaseStories.ts", "❌ Error loading data", { err });
            if (err instanceof TypeError && err.message === 'Failed to fetch') {
                setError('Missing Supabase configuration or network error. Please check your Supabase URL and API key.');
            }
            else {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            }
        }
        finally {
            setLoading(false);
        }
    }, [user, ensurePrioritySprintExists, ensureBacklogSprintExists]);
    // FIXED: Force refresh function for troubleshooting
    const forceRefresh = useCallback(() => {
        debug.info("useSupabaseStories.ts", '🔄 Force refreshing data...');
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
        if (!user || !userProfile)
            return;
        try {
            setOperationLoading(prev => ({ ...prev, [`add-story-${sprintId}`]: true }));
            // Generate story number
            const { data: existingStories } = await supabase
                .from('stories')
                .select('number')
                .order('created_at', { ascending: false })
                .limit(1);
            const lastNumber = existingStories?.[0]?.number || `${userProfile.settings.storyNumberPrefix}-000`;
            const numberMatch = lastNumber.match(/(\d+)$/);
            const nextNumber = numberMatch ? parseInt(numberMatch[1]) + 1 : 1;
            const paddedNumber = nextNumber.toString().padStart(3, '0');
            const storyNumber = `${userProfile.settings.storyNumberPrefix}-${paddedNumber}`;
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
                completed: false,
                date: new Date().toLocaleDateString('en-GB')
            });
            if (error)
                throw error;
            if (VERBOSE_LOGGING) {
                debug.info("useSupabaseStories.ts", "✅ Story added successfully", { storyNumber });
            }
            await loadData(true); // Force refresh after adding
        }
        catch (err) {
            debug.error("useSupabaseStories.ts", "❌ Error adding story", { err });
            setError(err instanceof Error ? err.message : 'Failed to add story');
        }
        finally {
            setOperationLoading(prev => ({ ...prev, [`add-story-${sprintId}`]: false }));
        }
    }, [user, userProfile, loadData]);
    // Update an existing story
    const updateStory = useCallback(async (storyId: string, storyData: {
        title: string;
        description?: string;
        tags?: string[];
    }) => {
        if (!user)
            return;
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
            if (error)
                throw error;
            // Update local state
            setSprints(prev => prev.map(sprint => ({
                ...sprint,
                stories: sprint.stories.map(story => story.id === storyId
                    ? {
                        ...story,
                        title: data.title,
                        description: data.description,
                        tags: data.tags || [],
                        updatedAt: data.updated_at
                    }
                    : story)
            })));
        }
        catch (err) {
            debug.error("useSupabaseStories.ts", "Error updating story", { err });
            setError(err instanceof Error ? err.message : 'Failed to update story');
        }
        finally {
            setOperationLoading(prev => {
                const { [operationId]: _, ...rest } = prev;
                return rest;
            });
        }
    }, [user]);
    // Delete a story
    const deleteStory = useCallback(async (storyId: string) => {
        if (!user)
            return;
        const operationId = `delete-story-${storyId}`;
        setOperationLoading(prev => ({ ...prev, [operationId]: true }));
        try {
            const { error } = await supabase
                .from('stories')
                .delete()
                .eq('id', storyId);
            if (error)
                throw error;
            // Update local state
            setSprints(prev => prev.map(sprint => ({
                ...sprint,
                stories: sprint.stories.filter(story => story.id !== storyId)
            })));
        }
        catch (err) {
            debug.error("useSupabaseStories.ts", "Error deleting story", { err });
            setError(err instanceof Error ? err.message : 'Failed to delete story');
        }
        finally {
            setOperationLoading(prev => {
                const { [operationId]: _, ...rest } = prev;
                return rest;
            });
        }
    }, [user]);
    // Add a new sprint
    const addSprint = useCallback(async (title: string, icon: string, description: string, isBacklog: boolean, isDraggable: boolean) => {
        if (!user)
            return;
        // CRITICAL: Prevent creating additional backlog sprints
        if (isBacklog) {
            debug.warn("useSupabaseStories.ts", 'Cannot create additional backlog sprints - one already exists');
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
                // CRITICAL: Backlog sprint should always be last (this should never happen due to prevention above)
                nextPosition = (allSprints?.[0]?.position || 0) + 1;
            }
            else {
                // Find the backlog sprint position
                const backlogSprint = allSprints?.find(sprint => sprint.is_backlog);
                if (backlogSprint) {
                    // Insert new sprint before the backlog
                    nextPosition = Math.max(1, backlogSprint.position); // Ensure position is at least 1
                    // Update backlog position to be after the new sprint
                    const { error: updateError } = await supabase
                        .from('sprints')
                        .update({ position: nextPosition + 1 })
                        .eq('id', backlogSprint.id);
                    if (updateError)
                        throw updateError;
                }
                else {
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
                is_backlog: false, // User sprints are never backlog
                is_draggable: isBacklog ? false : isDraggable, // Backlog sprints are never draggable
                user_id: user.id,
                position: nextPosition
            })
                .select()
                .single();
            if (error)
                throw error;
            // Reload data to get correct ordering
            await loadData();
        }
        catch (err) {
            debug.error("useSupabaseStories.ts", "Error adding sprint", { err });
            setError(err instanceof Error ? err.message : 'Failed to add sprint');
        }
        finally {
            setOperationLoading(prev => {
                const { [operationId]: _, ...rest } = prev;
                return rest;
            });
        }
    }, [user, loadData]);
    // Delete sprint
    const deleteSprint = useCallback(async (sprintId: string) => {
        // CRITICAL: Prevent deletion of backlog sprint and priority sprint
        const sprint = sprints.find(s => s.id === sprintId);
        if (sprint?.isBacklog) {
            debug.warn("useSupabaseStories.ts", 'Cannot delete backlog sprint');
            setError('Backlog sprint cannot be deleted');
            return;
        }
        if (sprintId === 'priority') {
            debug.warn("useSupabaseStories.ts", 'Cannot delete priority sprint');
            setError('Priority sprint cannot be deleted');
            return;
        }
        const operationId = `delete-sprint-${sprintId}`;
        setOperationLoading(prev => ({ ...prev, [operationId]: true }));
        try {
            const { error } = await supabase
                .from('sprints')
                .delete()
                .eq('id', sprintId);
            if (error)
                throw error;
            // Update local state
            setSprints(prev => prev.filter(sprint => sprint.id !== sprintId));
        }
        catch (err) {
            debug.error("useSupabaseStories.ts", "Error deleting sprint", { err });
            setError(err instanceof Error ? err.message : 'Failed to delete sprint');
        }
        finally {
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
            if (!currentStory)
                throw new Error('Story not found');
            const newCompleted = !currentStory.completed;
            const completedAt = newCompleted ? new Date().toISOString() : null;
            const { error } = await supabase
                .from('stories')
                .update({
                completed: newCompleted,
                completed_at: completedAt
            })
                .eq('id', storyId);
            if (error)
                throw error;
            // Update local state
            setSprints(prev => prev.map(sprint => ({
                ...sprint,
                stories: sprint.stories.map(story => story.id === storyId
                    ? { ...story, completed: newCompleted, completedAt }
                    : story)
            })));
        }
        catch (err) {
            debug.error("useSupabaseStories.ts", "Error toggling story", { err });
            setError(err instanceof Error ? err.message : 'Failed to toggle story');
        }
        finally {
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
            if (error)
                throw error;
            // Update local state
            setSprints(prev => {
                const story = prev
                    .flatMap(sprint => sprint.stories)
                    .find(s => s.id === storyId);
                if (!story)
                    return prev;
                return prev.map(sprint => ({
                    ...sprint,
                    stories: sprint.id === targetSprintId
                        ? [...sprint.stories.filter(s => s.id !== storyId), { ...story, sprintId: targetSprintId }]
                        : sprint.stories.filter(s => s.id !== storyId)
                }));
            });
        }
        catch (err) {
            debug.error("useSupabaseStories.ts", "Error moving story", { err });
            setError(err instanceof Error ? err.message : 'Failed to move story');
        }
        finally {
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
            }
            else {
                await archiveAllStoriesInSprint(sprintId);
            }
            await loadData(); // Refresh data
        }
        catch (err) {
            debug.error("useSupabaseStories.ts", "Error closing sprint", { err });
            setError(err instanceof Error ? err.message : 'Failed to close sprint');
        }
        finally {
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
    // Initialize data on mount and user change
    useEffect(() => {
        if (user) {
            loadData();
        }
        else {
            setSprints([]);
            setIsInitialized(false);
        }
    }, [user, loadData]);
    // Set up real-time subscriptions
    useEffect(() => {
        if (!user || !isInitialized)
            return;
        const sprintsSubscription = supabase
            .channel('sprints_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sprints', filter: `user_id=eq.${user.id}` }, () => {
            debug.info("useSupabaseStories.ts", '🔄 Sprints changed, refreshing...');
            loadData(true);
        })
            .subscribe();
        const storiesSubscription = supabase
            .channel('stories_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => {
            debug.info("useSupabaseStories.ts", '🔄 Stories changed, refreshing...');
            loadData(true);
        })
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
        updateStory,
        deleteStory,
        addSprint,
        deleteSprint,
        toggleStory,
        moveStory,
        closeSprint,
        getSprintStats,
        forceRefresh, // Export for debugging
        refreshData: loadData
    };
};
