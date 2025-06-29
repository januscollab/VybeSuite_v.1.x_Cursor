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
import { Story } from '../types';

export const ArchiveView: React.FC = () => {
  const [archivedStories, setArchivedStories] = useState<Story[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);

  const { 
    loading: archiveLoading, 
    error: archiveError, 
    loadArchivedData, 
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
      // Flatten all archived stories from sprints and orphaned stories
      const allArchivedStories = [
        ...result.sprints.flatMap(sprint => sprint.stories),
        ...result.orphanedStories
      ];
      setArchivedStories(allArchivedStories);
    }
  };

  const loadStats = async () => {
    const archiveStats = await getArchiveStats();
    if (archiveStats) {
      setStats(archiveStats);
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

  const getDisplayData = () => {
    if (hasActiveFilters) {
      return searchResults.stories.filter(story => story.archivedAt);
    }
    return archivedStories;
  };

  const displayStories = getDisplayData();
  const loading = archiveLoading || searchLoading;

  if (loading && archivedStories.length === 0) {
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
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-bg-primary border border-border-default text-text-secondary hover:bg-bg-muted rounded-lg transition-all"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Compact Search and Filter Panel - Always Visible */}
      <SearchFilterPanel
        filters={filters}
        onUpdateFilters={updateFilters}
        onClearFilters={clearFilters}
        showArchived={true}
        className="mb-6"
      />

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

      {displayStories.length === 0 ? (
        <div className="bg-bg-primary border border-border-default rounded-xl p-12 text-center">
          <Archive className="w-12 h-12 text-text-quaternary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {hasActiveFilters ? 'No matching archived stories' : 'No archived stories'}
          </h3>
          <p className="text-text-tertiary mb-4">
            {hasActiveFilters 
              ? 'Try adjusting your search filters to find archived stories.'
              : 'Archived stories will appear here when you archive them.'
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
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Archived Stories ({displayStories.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayStories.map(story => (
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
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        sprints={[]} // No sprints in archive view
        stories={displayStories}
        filters={hasActiveFilters ? filters : undefined}
      />
    </div>
  );
};