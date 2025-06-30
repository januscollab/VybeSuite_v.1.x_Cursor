// src/App.tsx - FIXED VERSION with proper imports and error handling
import React, { useState, useCallback } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { PromptProvider } from './contexts/PromptContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Header } from './components/Header';
import { DragDropSprintBoard } from './components/DragDropSprintBoard';
import { ArchiveView } from './components/ArchiveView';
import { StoryModal } from './components/StoryModal';
import { SettingsModal } from './components/SettingsModal';
import { OpenSprintModal } from './components/OpenSprintModal';
import { AddSprintModal } from './components/AddSprintModal';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { PulsingDotsLoader } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useSupabaseStories } from './hooks/useSupabaseStories';
import { loadAISettings, saveAISettings } from './utils/aiSettings';
import { AISettings, Sprint, Story } from './types';
import { AlertTriangle, Database, RefreshCw } from 'lucide-react';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PromptProvider>
          <AppContent />
        </PromptProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const [activeView, setActiveView] = useState<'active' | 'archive'>('active');
  const [aiSettings, setAISettings] = useState<AISettings>(loadAISettings());
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [profileSettingsModalOpen, setProfileSettingsModalOpen] = useState(false);
  const [addStoryModal, setAddStoryModal] = useState<{
    isOpen: boolean;
    sprintId: string;
    sprintTitle: string;
  }>({
    isOpen: false,
    sprintId: '',
    sprintTitle: ''
  });
  const [openSprintModal, setOpenSprintModal] = useState<{
    isOpen: boolean;
    sprintId: string;
  }>({
    isOpen: false,
    sprintId: ''
  });
  const [addSprintModalOpen, setAddSprintModalOpen] = useState(false);
  const [editStoryModal, setEditStoryModal] = useState<{
    isOpen: boolean;
    story: Story | null;
  }>({
    isOpen: false,
    story: null
  });

  // FIXED: Use the corrected hook with proper error handling
  const {
    sprints,
    loading,
    error,
    isInitialized,
    operationLoading,
    addStory,
    updateStory,
    toggleStory,
    moveStory,
    addSprint,
    updateSprint,
    deleteSprint,
    closeSprint,
    moveSprint,
    forceRefresh, // For debugging
    getSprintStats
  } = useSupabaseStories();

  // FIXED: Handle AI settings updates
  const handleAISettingsChange = useCallback((newSettings: AISettings) => {
    setAISettings(newSettings);
    saveAISettings(newSettings);
  }, []);

  // FIXED: Modal handlers with proper error handling
  const handleAddStory = useCallback((sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) {
      console.error('Sprint not found:', sprintId);
      return;
    }
    
    setAddStoryModal({
      isOpen: true,
      sprintId,
      sprintTitle: sprint.title
    });
  }, [sprints]);

  const handleEditStory = useCallback((story: Story) => {
    setEditStoryModal({
      isOpen: true,
      story
    });
  }, []);

  const handleCloseStoryModal = useCallback(() => {
    setAddStoryModal({
      isOpen: false,
      sprintId: '',
      sprintTitle: ''
    });
    setEditStoryModal({
      isOpen: false,
      story: null
    });
  }, []);

  const handleStorySubmit = useCallback(async (storyData: {
    title: string;
    description?: string;
    tags?: string[];
    priority?: string;
    risk?: string;
  }) => {
    try {
      if (editStoryModal.story) {
        // Update existing story
        await updateStory(editStoryModal.story.id, storyData);
      } else {
        // Add new story
        await addStory(addStoryModal.sprintId, storyData);
      }
      handleCloseStoryModal();
    } catch (err) {
      console.error('Error submitting story:', err);
      // Error is handled by the hook
    }
  }, [addStoryModal.sprintId, editStoryModal.story, addStory, updateStory, handleCloseStoryModal]);

  const handleOpenSprint = useCallback((sprintId: string) => {
    setOpenSprintModal({
      isOpen: true,
      sprintId
    });
  }, []);

  const handleCloseSprint = useCallback(async (sprintId: string, type: 'completed' | 'all') => {
    try {
      await closeSprint(sprintId, type);
    } catch (err) {
      console.error('Error closing sprint:', err);
    }
  }, [closeSprint]);

  const handleDeleteSprint = useCallback(async (sprintId: string) => {
    try {
      await deleteSprint(sprintId);
    } catch (err) {
      console.error('Error deleting sprint:', err);
    }
  }, [deleteSprint]);

  const handleToggleStory = useCallback(async (storyId: string) => {
    try {
      await toggleStory(storyId);
    } catch (err) {
      console.error('Error toggling story:', err);
    }
  }, [toggleStory]);

  const handleMoveStory = useCallback(async (storyId: string, destinationSprintId: string, newPosition: number) => {
    try {
      await moveStory(storyId, destinationSprintId, newPosition);
    } catch (err) {
      console.error('Error moving story:', err);
    }
  }, [moveStory]);

  const handleMoveSprint = useCallback(async (sprintId: string, newPosition: number) => {
    try {
      await moveSprint(sprintId, newPosition);
    } catch (err) {
      console.error('Error moving sprint:', err);
    }
  }, [moveSprint]);

  const handleAddSprint = useCallback(async (sprintData: {
    title: string;
    description?: string;
    icon: string;
  }) => {
    try {
      await addSprint(sprintData);
      setAddSprintModalOpen(false);
    } catch (err) {
      console.error('Error adding sprint:', err);
    }
  }, [addSprint]);

  // FIXED: Error display component
  if (error) {
    return (
      <div className="min-h-screen bg-bg-canvas flex items-center justify-center p-6">
        <div className="bg-bg-primary rounded-xl shadow-devsuite-modal border border-error w-full max-w-md p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Connection Error</h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={forceRefresh}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-devsuite-primary text-text-inverse rounded-lg hover:bg-devsuite-primary-hover transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
            <p className="text-xs text-text-quaternary">
              Check your Supabase configuration and internet connection
            </p>
          </div>
        </div>
      </div>
    );
  }

  // FIXED: Loading state
  if (loading && !isInitialized) {
    return (
      <div className="min-h-screen bg-bg-canvas flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-devsuite-primary rounded-lg flex items-center justify-center text-text-inverse font-bold text-xl mx-auto mb-4">
            SM
          </div>
          <PulsingDotsLoader />
          <p className="text-text-secondary mt-4">Loading Sprint Board...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-canvas">
        {/* FIXED: Header with proper props */}
        <Header
          activeView={activeView}
          onViewChange={setActiveView}
          onAddSprint={() => setAddSprintModalOpen(true)}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenProfileSettings={() => setProfileSettingsModalOpen(true)}
        />

        {/* FIXED: Main content with error boundary */}
        <main className="container mx-auto px-6 py-8">
          {activeView === 'active' ? (
            <DragDropSprintBoard
              sprints={sprints}
              operationLoading={operationLoading}
              getSprintStats={getSprintStats}
              onAddStory={handleAddStory}
              onOpenSprint={handleOpenSprint}
              onCloseSprint={handleCloseSprint}
              onDeleteSprint={handleDeleteSprint}
              onToggleStory={handleToggleStory}
              onMoveStory={handleMoveStory}
              onMoveSprint={handleMoveSprint}
              onEditStory={handleEditStory}
            />
          ) : (
            <ArchiveView />
          )}
        </main>

        {/* FIXED: All Modals with proper error handling */}
        {addStoryModal.isOpen && (
          <StoryModal
            isOpen={addStoryModal.isOpen}
            onClose={handleCloseStoryModal}
            onSubmit={handleStorySubmit}
            sprintTitle={addStoryModal.sprintTitle}
            aiSettings={aiSettings}
            mode="add"
          />
        )}

        {editStoryModal.isOpen && editStoryModal.story && (
          <StoryModal
            isOpen={editStoryModal.isOpen}
            onClose={handleCloseStoryModal}
            onSubmit={handleStorySubmit}
            sprintTitle=""
            aiSettings={aiSettings}
            mode="edit"
            initialData={editStoryModal.story}
          />
        )}

        {openSprintModal.isOpen && (
          <OpenSprintModal
            isOpen={openSprintModal.isOpen}
            onClose={() => setOpenSprintModal({ isOpen: false, sprintId: '' })}
            sprintId={openSprintModal.sprintId}
            sprints={sprints}
          />
        )}

        {settingsModalOpen && (
          <SettingsModal
            isOpen={settingsModalOpen}
            onClose={() => setSettingsModalOpen(false)}
            aiSettings={aiSettings}
            onAISettingsChange={handleAISettingsChange}
          />
        )}

        {profileSettingsModalOpen && (
          <ProfileSettingsModal
            isOpen={profileSettingsModalOpen}
            onClose={() => setProfileSettingsModalOpen(false)}
          />
        )}

        {addSprintModalOpen && (
          <AddSprintModal
            isOpen={addSprintModalOpen}
            onClose={() => setAddSprintModalOpen(false)}
            onSubmit={handleAddSprint}
          />
        )}

        {/* FIXED: Debug panel in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-bg-primary border rounded-lg p-2 shadow-lg text-xs">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-3 h-3" />
              <span className="font-medium">Debug Info</span>
            </div>
            <div className="space-y-1 text-text-tertiary">
              <div>Sprints: {sprints.length}</div>
              <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
              <div>Loading: {loading ? '⏳' : '✅'}</div>
              {error && <div className="text-error">Error: {error}</div>}
              <button
                onClick={forceRefresh}
                className="text-devsuite-primary hover:underline"
              >
                Force Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default App;