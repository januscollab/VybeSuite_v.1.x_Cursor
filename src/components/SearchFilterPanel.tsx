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
    <div className={`bg-bg-primary border border-border-default rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Search & Filter
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-secondary hover:text-error transition-colors"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Search Query */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Search Stories
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-quaternary" />
            <input
              type="text"
              value={filters.query}
              onChange={(e) => onUpdateFilters({ query: e.target.value })}
              placeholder="Search titles, descriptions, numbers..."
              className="w-full pl-10 pr-4 py-2.5 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => onUpdateFilters({ status: e.target.value as 'all' | 'completed' | 'todo' })}
              className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
            >
              <option value="all">All Stories</option>
              <option value="completed">Completed</option>
              <option value="todo">To Do</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Created From
            </label>
            <input
              type="date"
              value={filters.dateRange.start || ''}
              onChange={(e) => onUpdateFilters({ 
                dateRange: { ...filters.dateRange, start: e.target.value || null }
              })}
              className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Created To
            </label>
            <input
              type="date"
              value={filters.dateRange.end || ''}
              onChange={(e) => onUpdateFilters({ 
                dateRange: { ...filters.dateRange, end: e.target.value || null }
              })}
              className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
            />
          </div>

          {/* Sprint Filter */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Sprint
            </label>
            <select
              value={filters.sprints[0] || ''}
              onChange={(e) => onUpdateFilters({ 
                sprints: e.target.value ? [e.target.value] : []
              })}
              className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
            >
              <option value="">All Sprints</option>
              <option value="priority">Priority Sprint</option>
              <option value="development">Development Sprint</option>
              <option value="backlog">Backlog</option>
            </select>
          </div>
        </div>

        {/* Tags Filter */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Tags
          </label>
          
          {/* Selected Tags */}
          {filters.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {filters.tags.map(tag => (
                <div
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 bg-devsuite-primary-subtle text-devsuite-primary rounded-full text-sm"
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

          {/* Tag Input */}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInput}
            placeholder="Type a tag and press Enter..."
            className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
          />

          {/* Preset Tags */}
          {availableTags.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-text-tertiary mb-2">Popular tags:</p>
              <div className="flex flex-wrap gap-1">
                {availableTags.slice(0, 10).map(tag => (
                  <button
                    key={tag}
                    onClick={() => addPresetTag(tag)}
                    disabled={filters.tags.includes(tag)}
                    className={`px-2 py-1 text-xs rounded-full transition-all ${
                      filters.tags.includes(tag)
                        ? 'bg-bg-muted text-text-disabled cursor-not-allowed'
                        : 'bg-bg-muted text-text-secondary hover:bg-devsuite-primary-subtle hover:text-devsuite-primary'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};