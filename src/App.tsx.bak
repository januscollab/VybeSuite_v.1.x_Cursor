import React, { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PromptProvider } from './contexts/PromptContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { AdminLayout } from './components/admin/AdminLayout';
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

// Reduced console noise during development
// if (process.env.NODE_ENV === 'development') {
//   console.log('App component loaded');
// }

function App() {
  // Reduced console noise during development
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('App rendering');
  // }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <PromptProvider>
          <Routes>
            {/* Main Sprint Board App */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            } />
            
            {/* Admin Panel */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              </ProtectedRoute>
            } />
          </Routes>
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

  // Use the corrected hook with proper error handling
  const {
    sprints,
    loading,
    error,
    isInitialized,
    operationLoading,
    addStory,
    updateStory,
    deleteStory,
    toggleStory,
    moveStory,
    addSprint,
    deleteSprint,
    closeSprint,
    forceRefresh,
    getSprintStats
  } = useSupabaseStories();

  // Handle AI settings updates
  const handleAISettingsChange = useCallback((newSettings: AISettings) => {
    setAISettings(newSettings);
    saveAISettings(newSettings);
  }, []);

  // Modal handlers with proper error handling
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
      // Note: moveSprint function doesn't exist in the hook, removing this for now
      console.log('Sprint moving not implemented yet');
    } catch (err) {
      console.error('Error moving sprint:', err);
    }
  }, []);

  const handleAddSprint = useCallback(async (title: string, icon: string, description: string, isBacklog: boolean, isDraggable: boolean) => {
    try {
      await addSprint({ title, icon, description });
      setAddSprintModalOpen(false);
    } catch (err) {
      console.error('Error adding sprint:', err);
    }
  }, [addSprint]);

  // Error display component
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

  // Loading state - only show loading while initializing
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
    <div className="min-h-screen bg-bg-canvas">
      {/* Header with proper props */}
      <Header
        activeView={activeView}
        onViewChange={setActiveView}
        onAddSprint={() => setAddSprintModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenProfileSettings={() => setProfileSettingsModalOpen(true)}
      />

        {/* Main content */}
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

        {/* All Modals */}
        {addStoryModal.isOpen && (
          <StoryModal
            isOpen={addStoryModal.isOpen}
            sprintId={addStoryModal.sprintId}
            sprintTitle={addStoryModal.sprintTitle}
            aiSettings={aiSettings}
            onClose={handleCloseStoryModal}
            onSubmit={handleStorySubmit}
          />
        )}

        {editStoryModal.isOpen && editStoryModal.story && (
          <StoryModal
            isOpen={editStoryModal.isOpen}
            sprintId=""
            sprintTitle=""
            aiSettings={aiSettings}
            story={editStoryModal.story}
            onClose={handleCloseStoryModal}
            onSubmit={handleStorySubmit}
          />
        )}

        {openSprintModal.isOpen && (
          <OpenSprintModal
            isOpen={openSprintModal.isOpen}
            sprint={sprints.find(s => s.id === openSprintModal.sprintId)!}
            onClose={() => setOpenSprintModal({ isOpen: false, sprintId: '' })}
          />
        )}

        {settingsModalOpen && (
          <SettingsModal
            isOpen={settingsModalOpen}
            settings={aiSettings}
            onClose={() => setSettingsModalOpen(false)}
            onSave={handleAISettingsChange}
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

        {/* Debug panel in development */}
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
    );
  }

export default App;