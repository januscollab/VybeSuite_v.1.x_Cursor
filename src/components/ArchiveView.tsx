import React, { useState, useEffect } from 'react';
import { Archive, RotateCcw, Trash2, Download, Search, Filter } from 'lucide-react';
import { useArchive } from '../hooks/useArchive';
import { useBulkActions } from '../hooks/useBulkActions';
import { useSearch } from '../hooks/useSearch';
import { LoadingSpinner } from './LoadingSpinner';
import { SearchFilterPanel } from './SearchFilterPanel';
import { BulkActionsBar } from './BulkActionsBar';
import { ExportModal } from './ExportModal';
import { ArchiveStoryCard } from './ArchiveStoryCard';
import { ArchiveSprintCard } from './ArchiveSprintCard';
import { Story, Sprint } from '../types';

export const ArchiveView: React.FC = () => {
  const [archivedSprints, setArchivedSprints] = useState<Sprint[]>([]);
  const [orphanedStories, setOrphanedStories] = useState<Story[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'sprints' | 'stories'>('all');

  const { 
    loading: archiveLoading, 
    error: archiveError, 
    loadArchivedData, 
    restoreSprint, 
    restoreStories,
    getArchiveStats 
  } = useArchive();

  const {
    selectedStories,
    loading: bulkLoading,
    toggleStorySelection,
    selectAllStories,
    clearSelection,
    executeBulkAction
  } = useBulkActions();

  const {
    filters,
    loading: searchLoading,
    searchResults,
    hasActiveFilters,
    getFilterSummary,
    updateFilters,
    clearFilters
  } = useSearch();

  const [stats, setStats] = useState({
    totalStories: 0,
    completedStories: 0,
    totalSprints: 0,
    archivedStories: 0,
    archivedSprints: 0
  });

  // Load archived data on mount
  useEffect(() => {
    loadData();
    loadStats();
  }, []);

  const loadData = async () => {
    const result = await loadArchivedData();
    if (result) {
      setArchivedSprints(result.sprints);
      setOrphanedStories(result.orphanedStories);
    }
  };

  const loadStats = async () => {
    const archiveStats = await getArchiveStats();
    if (archiveStats) {
      setStats(archiveStats);
    }
  };

  const handleRestoreSprint = async (sprintId: string) => {
    const success = await restoreSprint(sprintId);
    if (success) {
      await loadData();
      await loadStats();
    }
  };

  const handleRestoreStories = async (storyIds: string[]) => {
    const success = await restoreStories(storyIds);
    if (success) {
      await loadData();
      await loadStats();
      clearSelection();
    }
  };

  const handleBulkRestore = async () => {
    if (selectedStories.length === 0) return;
    
    const success = await executeBulkAction({
      type: 'restore',
      storyIds: selectedStories
    });
    
    if (success) {
      await loadData();
      await loadStats();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStories.length === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${selectedStories.length} stories? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    const success = await executeBulkAction({
      type: 'delete',
      storyIds: selectedStories
    });
    
    if (success) {
      await loadData();
      await loadStats();
    }
  };

  const getAllArchivedStories = () => {
    const sprintStories = archivedSprints.flatMap(sprint => sprint.stories);
    return [...sprintStories, ...orphanedStories];
  };

  const getDisplayData = () => {
    if (hasActiveFilters) {
      return {
        sprints: searchResults.sprints.filter(sprint => sprint.archivedAt),
        stories: searchResults.stories.filter(story => story.archivedAt)
      };
    }

    return {
      sprints: archivedSprints,
      stories: getAllArchivedStories()
    };
  };

  const displayData = getDisplayData();
  const loading = archiveLoading || searchLoading;

  if (loading && archivedSprints.length === 0) {
    return (
      <div className="p-6 max-w-none mx-auto">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" className="mr-3" />
          <span className="text-text-secondary">Loading archived items...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-none mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Archive</h1>
          <div className="flex items-center gap-4 text-sm text-text-tertiary">
            <span>{stats.archivedSprints} archived sprints</span>
            <span>•</span>
            <span>{stats.archivedStories} archived stories</span>
            {hasActiveFilters && (
              <>
                <span>•</span>
                <span className="text-devsuite-primary">
                  Filtered: {getFilterSummary.join(', ')}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'all'
                  ? 'bg-bg-primary text-devsuite-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('sprints')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'sprints'
                  ? 'bg-bg-primary text-devsuite-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sprints
            </button>
            <button
              onClick={() => setViewMode('stories')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'stories'
                  ? 'bg-bg-primary text-devsuite-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Stories
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              showFilters || hasActiveFilters
                ? 'bg-devsuite-primary text-text-inverse'
                : 'bg-bg-primary border border-border-default text-text-secondary hover:bg-bg-muted'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-bg-primary border border-border-default text-text-secondary hover:bg-bg-muted rounded-lg transition-all"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Search and Filter Panel */}
      {showFilters && (
        <SearchFilterPanel
          filters={filters}
          onUpdateFilters={updateFilters}
          onClearFilters={clearFilters}
          showArchived={true}
          className="mb-6"
        />
      )}

      {/* Bulk Actions Bar */}
      {selectedStories.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedStories.length}
          onRestore={handleBulkRestore}
          onDelete={handleBulkDelete}
          onClearSelection={clearSelection}
          loading={bulkLoading}
          showArchiveActions={false}
          className="mb-6"
        />
      )}

      {/* Content */}
      {archiveError && (
        <div className="bg-error-light border border-error rounded-lg p-4 mb-6">
          <p className="text-error-dark">{archiveError}</p>
        </div>
      )}

      {displayData.sprints.length === 0 && displayData.stories.length === 0 ? (
        <div className="bg-bg-primary border border-border-default rounded-xl p-12 text-center">
          <Archive className="w-12 h-12 text-text-quaternary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {hasActiveFilters ? 'No matching archived items' : 'No archived items'}
          </h3>
          <p className="text-text-tertiary mb-4">
            {hasActiveFilters 
              ? 'Try adjusting your search filters to find archived items.'
              : 'Archived sprints and stories will appear here when you archive them.'
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-devsuite-primary text-text-inverse rounded-lg hover:bg-devsuite-primary-hover transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Archived Sprints */}
          {(viewMode === 'all' || viewMode === 'sprints') && displayData.sprints.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                Archived Sprints ({displayData.sprints.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {displayData.sprints.map(sprint => (
                  <ArchiveSprintCard
                    key={sprint.id}
                    sprint={sprint}
                    selectedStories={selectedStories}
                    onRestoreSprint={() => handleRestoreSprint(sprint.id)}
                    onRestoreStories={handleRestoreStories}
                    onToggleStorySelection={toggleStorySelection}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Orphaned Stories */}
          {(viewMode === 'all' || viewMode === 'stories') && orphanedStories.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                Archived Stories ({orphanedStories.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {orphanedStories.map(story => (
                  <ArchiveStoryCard
                    key={story.id}
                    story={story}
                    isSelected={selectedStories.includes(story.id)}
                    onToggleSelection={() => toggleStorySelection(story.id)}
                    onRestore={() => handleRestoreStories([story.id])}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        sprints={displayData.sprints}
        stories={displayData.stories}
        filters={hasActiveFilters ? filters : undefined}
      />
    </div>
  );
};