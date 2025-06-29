import React, { useState, useEffect } from 'react';
import { Search, X, Calendar, Tag, Filter } from 'lucide-react';
import { SearchFilters } from '../types';
import { useSearch } from '../hooks/useSearch';

interface SearchFilterPanelProps {
  filters: SearchFilters;
  onUpdateFilters: (filters: Partial<SearchFilters>) => void;
  onClearFilters: () => void;
  showArchived?: boolean;
  className?: string;
}

export const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({
  filters,
  onUpdateFilters,
  onClearFilters,
  showArchived = false,
  className = ''
}) => {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const { getAllTags } = useSearch();

  // Load available tags
  useEffect(() => {
    const loadTags = async () => {
      const tags = await getAllTags();
      setAvailableTags(tags);
    };
    loadTags();
  }, [getAllTags]);

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!filters.tags.includes(newTag)) {
        onUpdateFilters({
          tags: [...filters.tags, newTag]
        });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onUpdateFilters({
      tags: filters.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const addPresetTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      onUpdateFilters({
        tags: [...filters.tags, tag]
      });
    }
  };

  const hasActiveFilters = 
    filters.query.trim() !== '' ||
    filters.tags.length > 0 ||
    filters.status !== 'all' ||
    filters.sprints.length > 0 ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null;

  return (
    <div className={`bg-bg-primary border border-border-default rounded-lg p-4 ${className}`}>
      {/* Compact Header */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-devsuite-primary">
            Filters Active: {getFilterSummary.join(', ')}
          </span>
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-error transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        </div>
      )}

      <div className="space-y-3">
        {/* Search Query */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-3 items-end">
          {/* Search Input */}
          <div className="relative">
            <label className="block text-xs font-medium text-text-primary mb-1">Search</label>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-quaternary" />
            <input
              type="text"
              value={filters.query}
              onChange={(e) => onUpdateFilters({ query: e.target.value })}
              placeholder="Search stories..."
              className="w-full pl-10 pr-4 py-2 border border-border-default rounded-md bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-1 focus:ring-devsuite-primary/20 transition-all text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => onUpdateFilters({ status: e.target.value as 'all' | 'completed' | 'todo' })}
              className="w-full px-3 py-2 border border-border-default rounded-md bg-bg-primary text-text-primary focus:outline-none focus:border-devsuite-primary focus:ring-1 focus:ring-devsuite-primary/20 transition-all text-sm"
            >
              <option value="all">All Stories</option>
              <option value="completed">Completed</option>
              <option value="todo">To Do</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Created From
            </label>
            <input
              type="date"
              value={filters.dateRange.start || ''}
              onChange={(e) => onUpdateFilters({ 
                dateRange: { ...filters.dateRange, start: e.target.value || null }
              })}
              className="w-full px-3 py-2 border border-border-default rounded-md bg-bg-primary text-text-primary focus:outline-none focus:border-devsuite-primary focus:ring-1 focus:ring-devsuite-primary/20 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Created To
            </label>
            <input
              type="date"
              value={filters.dateRange.end || ''}
              onChange={(e) => onUpdateFilters({ 
                dateRange: { ...filters.dateRange, end: e.target.value || null }
              })}
              className="w-full px-3 py-2 border border-border-default rounded-md bg-bg-primary text-text-primary focus:outline-none focus:border-devsuite-primary focus:ring-1 focus:ring-devsuite-primary/20 transition-all text-sm"
            />
          </div>

          {/* Sprint Filter */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Sprint
            </label>
            <select
              value={filters.sprints[0] || ''}
              onChange={(e) => onUpdateFilters({ 
                sprints: e.target.value ? [e.target.value] : []
              })}
              className="w-full px-3 py-2 border border-border-default rounded-md bg-bg-primary text-text-primary focus:outline-none focus:border-devsuite-primary focus:ring-1 focus:ring-devsuite-primary/20 transition-all text-sm"
            >
              <option value="">All Sprints</option>
              <option value="priority">Priority Sprint</option>
              <option value="development">Development Sprint</option>
              <option value="backlog">Backlog</option>
            </select>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">
              Tags
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInput}
              placeholder="Add tags..."
              className="w-full px-3 py-2 border border-border-default rounded-md bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-1 focus:ring-devsuite-primary/20 transition-all text-sm"
            />
          </div>
        </div>

        {/* Selected Tags Display */}
        {filters.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.tags.map(tag => (
              <div
                key={tag}
                className="flex items-center gap-1 px-2 py-1 bg-devsuite-primary-subtle text-devsuite-primary rounded-full text-xs"
              >
                <Tag className="w-3 h-3" />
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-error transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};