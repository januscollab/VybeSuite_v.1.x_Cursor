import React, { useState } from 'react';
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
import { AlertTriangle, Database } from 'lucide-react';

function App() {
  return (
    <AuthProvider>
      <PromptProvider>
        <AppContent />
      </PromptProvider>
    </AuthProvider>
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
  const [addSprintModal, setAddSprintModal] = useState(false);
  const [openSprintModal, setOpenSprintModal] = useState<{
    isOpen: boolean;
    sprint: Sprint | null;
  }>({
    isOpen: false,
    sprint: null
  });
  const [editStoryModal, setEditStoryModal] = useState<{
    isOpen: boolean;
    story: Story | null;
  }>({ isOpen: false, story: null });
  const [showDashboard, setShowDashboard] = useState(false);

  // Always call hooks at the top level - never conditionally
  const { 
    sprints, 
    loading, 
    error, 
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
    refreshData 
  } = useSupabaseStories();

  // CRITICAL FIX: Only show full-screen loader on initial load when no sprints exist
  const showFullLoader = loading && sprints.length === 0;

  const handleCloseBoard = () => {
    setShowDashboard(true);
  };

  const handleAddSprint = () => {
    setAddSprintModal(true);
  };

  const handleCloseAddSprintModal = () => {
    setAddSprintModal(false);
  };

  const handleSubmitSprint = (title: string, icon: string, description: string, isBacklog: boolean, isDraggable: boolean) => {
    addSprint(title, icon, description, isBacklog, isDraggable);
  };

  const handleOpenSettings = () => {
    setSettingsModalOpen(true);
  };

  const handleOpenProfileSettings = () => {
    setProfileSettingsModalOpen(true);
  };

  const handleSaveAISettings = (newSettings: AISettings) => {
    setAISettings(newSettings);
    saveAISettings(newSettings);
  };

  const handleAddStory = (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (sprint) {
      setAddStoryModal({
        isOpen: true,
        sprintId,
        sprintTitle: sprint.title
      });
    }
  };

  const handleEditStory = (story: Story) => {
    setEditStoryModal({
      isOpen: true,
      story
    });
  };

  const handleCloseAddStoryModal = () => {
    setAddStoryModal({
      isOpen: false,
      sprintId: '',
      sprintTitle: ''
    });
  };

  const handleCloseEditStoryModal = () => {
    setEditStoryModal({
      isOpen: false,
      story: null
    });
  };

  const handleSubmitStory = (storyData: any) => {
    addStory(storyData);
  };

  const handleUpdateStory = (storyData: any) => {
    updateStory(storyData);
  };

  const handleDeleteStory = (storyId: string) => {
    deleteStory(storyId);
  };

  const handleToggleStory = (storyId: string) => {
    toggleStory(storyId);
  };

  const handleMoveStory = (storyId: string, destinationSprintId: string, newPosition: number) => {
    moveStory(storyId, destinationSprintId, newPosition);
  };

  const handleMoveSprint = (sprintId: string, newPosition: number) => {
    // moveSprint functionality would be implemented here
    console.log('Move sprint:', sprintId, 'to position:', newPosition);
  };

  const handleOpenSprint = (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (sprint) {
      setOpenSprintModal({
        isOpen: true,
        sprint
      });
    }
  };

  const handleCloseOpenSprintModal = () => {
    setOpenSprintModal({
      isOpen: false,
      sprint: null
    });
  };

  const handleCloseSprint = (sprintId: string, type: 'completed' | 'all') => {
    closeSprint(sprintId, type);
  };

  const handleDeleteSprint = (sprintId: string) => {
    deleteSprint(sprintId);
  };

  // Dashboard view
  if (showDashboard) {
    return (
      <div className="min-h-screen bg-bg-canvas flex items-center justify-center p-6">
        <div className="bg-bg-primary border border-border-default rounded-xl p-8 max-w-md w-full text-center shadow-devsuite">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Dashboard</h1>
          <p className="text-text-secondary mb-6">Welcome to your project dashboard.</p>
          <button
            onClick={() => setShowDashboard(false)}
            className="px-4 py-2 bg-devsuite-primary text-text-inverse rounded-lg hover:bg-devsuite-primary-hover transition-colors"
          >
            Back to Sprint Board
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <div className="min-h-screen bg-bg-canvas">
          {/* FIXED: Only show loading overlay for initial load when no sprints exist */}
          {showFullLoader && (
            <div className="min-h-screen bg-bg-canvas flex items-center justify-center">
              <div className="text-center">
                <PulsingDotsLoader size="lg" className="mx-auto mb-4" />
                <p className="text-text-secondary">Loading your sprint board...</p>
              </div>
            </div>
          )}

          {/* Error state overlay */}
          {error && (
            <div className="min-h-screen bg-bg-canvas flex items-center justify-center p-6">
              <div className="bg-bg-primary border border-border-default rounded-xl p-8 max-w-md w-full text-center shadow-devsuite">
                <div className="flex justify-center mb-4">
                  {error.includes('Missing Supabase') ? (
                    <Database className="w-12 h-12 text-warning" />
                  ) : (
                    <AlertTriangle className="w-12 h-12 text-error" />
                  )}
                </div>
                <h1 className="text-xl font-bold text-text-primary mb-2">
                  {error.includes('Missing Supabase') ? 'Database Setup Required' : 'Connection Error'}
                </h1>
                <p className="text-text-secondary mb-6">
                  {error.includes('Missing Supabase') 
                    ? 'Please click "Connect to Supabase" in the top right to set up your database.'
                    : error}
                </p>
                <button
                  onClick={refreshData}
                  className="px-4 py-2 bg-devsuite-primary text-text-inverse rounded-lg hover:bg-devsuite-primary-hover transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* FIXED: Show content immediately when sprints exist, with optional operation loading */}
          {!showFullLoader && !error && (
            <>
              <Header 
                activeView={activeView}
                onViewChange={setActiveView}
                onAddSprint={handleAddSprint}
                onOpenSettings={handleOpenSettings}
                onOpenProfileSettings={handleOpenProfileSettings}
                operationLoading={operationLoading} // Pass operation loading to header for subtle indicators
              />

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
                  onCloseBoard={handleCloseBoard}
                />
              ) : (
                <ArchiveView />
              )}

              <StoryModal
                isOpen={addStoryModal.isOpen}
                sprintId={addStoryModal.sprintId}
                sprintTitle={addStoryModal.sprintTitle}
                aiSettings={aiSettings}
                onClose={handleCloseAddStoryModal}
                onSubmit={handleSubmitStory}
              />

              <StoryModal
                isOpen={editStoryModal.isOpen}
                sprintId={editStoryModal.story?.sprintId || ''}
                sprintTitle=""
                aiSettings={aiSettings}
                story={editStoryModal.story}
                onClose={handleCloseEditStoryModal}
                onSubmit={handleSubmitStory}
                onUpdate={handleUpdateStory}
                onDelete={handleDeleteStory}
              />

              <SettingsModal
                isOpen={settingsModalOpen}
                settings={aiSettings}
                onClose={() => setSettingsModalOpen(false)}
                onSave={handleSaveAISettings}
              />

              <ProfileSettingsModal
                isOpen={profileSettingsModalOpen}
                onClose={() => setProfileSettingsModalOpen(false)}
              />

              {openSprintModal.sprint && (
                <OpenSprintModal
                  isOpen={openSprintModal.isOpen}
                  sprint={openSprintModal.sprint}
                  onClose={handleCloseOpenSprintModal}
                />
              )}

              <AddSprintModal
                isOpen={addSprintModal}
                onClose={handleCloseAddSprintModal}
                onSubmit={handleSubmitSprint}
              />
            </>
          )}
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}

export default App;