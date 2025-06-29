import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Story, Sprint, SearchFilters } from '../types';

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  tags: [],
  status: 'all',
  sprints: [],
  dateRange: {
    start: null,
    end: null
  }
};

export const useSearch = () => {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{
    stories: Story[];
    sprints: Sprint[];
  }>({ stories: [], sprints: [] });

  // Get all available tags for filtering
  const getAllTags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('tags')
        .not('tags', 'is', null);

      if (error) throw error;

      const allTags = new Set<string>();
      data?.forEach(story => {
        story.tags?.forEach((tag: string) => allTags.add(tag));
      });

      return Array.from(allTags).sort();
    } catch (err) {
      console.error('Error getting tags:', err);
      return [];
    }
  }, []);

  // Search stories and sprints based on filters
  const search = useCallback(async (searchFilters: SearchFilters = filters) => {
    try {
      setLoading(true);
      setError(null);

      // Build story query
      let storyQuery = supabase
        .from('stories')
        .select('*')
        .is('archived_at', null); // Only non-archived stories

      // Apply text search
      if (searchFilters.query.trim()) {
        storyQuery = storyQuery.textSearch('search_vector', searchFilters.query.trim(), { type: 'plain' });
      }

      // Apply status filter
      if (searchFilters.status === 'completed') {
        storyQuery = storyQuery.eq('completed', true);
      } else if (searchFilters.status === 'todo') {
        storyQuery = storyQuery.eq('completed', false);
      }

      // Apply sprint filter
      if (searchFilters.sprints.length > 0) {
        storyQuery = storyQuery.in('sprint_id', searchFilters.sprints);
      }

      // Apply tag filter
      if (searchFilters.tags.length > 0) {
        storyQuery = storyQuery.overlaps('tags', searchFilters.tags);
      }

      // Apply date range filter
      if (searchFilters.dateRange.start) {
        storyQuery = storyQuery.gte('created_at', searchFilters.dateRange.start);
      }
      if (searchFilters.dateRange.end) {
        storyQuery = storyQuery.lte('created_at', searchFilters.dateRange.end);
      }

      // Execute story search
      const { data: stories, error: storyError } = await storyQuery
        .order('created_at', { ascending: false });

      if (storyError) throw storyError;

      // Build sprint query
      let sprintQuery = supabase
        .from('sprints')
        .select('*')
        .is('archived_at', null); // Only non-archived sprints

      // Apply sprint text search (title only for sprints)
      if (searchFilters.query.trim()) {
        sprintQuery = sprintQuery.ilike('title', `%${searchFilters.query.trim()}%`);
      }

      // Apply sprint filter
      if (searchFilters.sprints.length > 0) {
        sprintQuery = sprintQuery.in('id', searchFilters.sprints);
      }

      // Execute sprint search
      const { data: sprints, error: sprintError } = await sprintQuery
        .order('position');

      if (sprintError) throw sprintError;

      // Transform results
      const transformedStories: Story[] = (stories || []).map(story => ({
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

      const transformedSprints: Sprint[] = (sprints || []).map(sprint => ({
        id: sprint.id,
        title: sprint.title,
        icon: sprint.icon,
        isBacklog: sprint.is_backlog,
        isDraggable: sprint.is_draggable,
        archivedAt: sprint.archived_at,
        stories: transformedStories.filter(story => story.sprintId === sprint.id)
      }));

      setSearchResults({
        stories: transformedStories,
        sprints: transformedSprints
      });

      return {
        stories: transformedStories,
        sprints: transformedSprints
      };
    } catch (err) {
      console.error('Error searching:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      return { stories: [], sprints: [] };
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Update filters and trigger search
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    search(updatedFilters);
  }, [filters, search]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchResults({ stories: [], sprints: [] });
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.query.trim() !== '' ||
      filters.tags.length > 0 ||
      filters.status !== 'all' ||
      filters.sprints.length > 0 ||
      filters.dateRange.start !== null ||
      filters.dateRange.end !== null
    );
  }, [filters]);

  // Get filter summary for display
  const getFilterSummary = useMemo(() => {
    const summary: string[] = [];
    
    if (filters.query.trim()) {
      summary.push(`"${filters.query.trim()}"`);
    }
    
    if (filters.tags.length > 0) {
      summary.push(`${filters.tags.length} tag${filters.tags.length > 1 ? 's' : ''}`);
    }
    
    if (filters.status !== 'all') {
      summary.push(filters.status === 'completed' ? 'completed' : 'todo');
    }
    
    if (filters.sprints.length > 0) {
      summary.push(`${filters.sprints.length} sprint${filters.sprints.length > 1 ? 's' : ''}`);
    }
    
    if (filters.dateRange.start || filters.dateRange.end) {
      summary.push('date range');
    } else {
      // When no date range is specified, indicate all-time search
      summary.push('all time');
    }

    return summary;
  }, [filters]);

  return {
    filters,
    loading,
    error,
    searchResults,
    hasActiveFilters,
    getFilterSummary,
    search,
    updateFilters,
    clearFilters,
    getAllTags
  };
};