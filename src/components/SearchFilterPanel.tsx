import React, { useState, useEffect } from 'react';
import { Search, X, Tag } from 'lucide-react';
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
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null;

  const getFilterSummary = () => {
    const summary: string[] = [];
    
    if (filters.query.trim()) {
      summary.push(`"${filters.query.trim()}"`);
    }
    
    if (filters.tags.length > 0) {
      summary.push(`${filters.tags.length} tag${filters.tags.length > 1 ? 's' : ''}`);
    }
    
    if (filters.dateRange.start || filters.dateRange.end) {
      summary.push('date range');
    }

    return summary;
  };

  return (
    <div className={`bg-bg-primary border border-border-default rounded-lg p-4 ${className}`}>
      {/* Compact Header */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-devsuite-primary">
            Filters Active: {getFilterSummary().join(', ')}
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
        {/* Simplified Search - Only 3 Criteria */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
          {/* Search Input */}
          <div className="relative">
            <label className="form-label">Keywords</label>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-quaternary z-10" />
            <input
              type="text"
              value={filters.query}
              onChange={(e) => onUpdateFilters({ query: e.target.value })}
              placeholder="Search archived stories..."
              className="form-input pl-10"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="form-label">
              Date Range {!filters.dateRange.start && !filters.dateRange.end && (
                <span className="text-xs text-devsuite-primary font-normal">(All Time)</span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.dateRange.start || ''}
                onChange={(e) => onUpdateFilters({ 
                  dateRange: { ...filters.dateRange, start: e.target.value || null }
                })}
                placeholder="From"
                className="form-input flex-1"
              />
              <input
                type="date"
                value={filters.dateRange.end || ''}
                onChange={(e) => onUpdateFilters({ 
                  dateRange: { ...filters.dateRange, end: e.target.value || null }
                })}
                placeholder="To"
                className="form-input flex-1"
              />
            </div>
            {!filters.dateRange.start && !filters.dateRange.end && (
              <div className="text-xs text-text-tertiary mt-1 flex items-center gap-1">
                <span>🌐</span>
                <span>Searching all available records</span>
              </div>
            )}
          </div>

          {/* Tags Filter */}
          <div>
            <label className="form-label">
              Tags
            </label>
            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInput}
                placeholder="Type and press Enter to add tags..."
                className="form-input"
              />
              {/* Tag autocomplete suggestions could be added here */}
            </div>
          </div>
        </div>

        {/* Selected Tags Display */}
        {filters.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.tags.map(tag => (
              <div
                key={tag}
                className="flex items-center gap-1 px-3 py-1 bg-devsuite-primary-subtle text-devsuite-primary rounded-full text-sm"
              >
                <Tag className="w-3 h-3" />
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-error transition-colors p-0.5"
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