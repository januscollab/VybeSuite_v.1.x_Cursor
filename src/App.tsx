import React, { useState } from 'react';
import { Header } from './components/Header';
import { DragDropSprintBoard } from './components/DragDropSprintBoard';
import { AddStoryModal } from './components/AddStoryModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useSupabaseStories } from './hooks/useSupabaseStories';
import { AlertTriangle, Database } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState<'active' | 'archive'>('active');
  const [addStoryModal, setAddStoryModal] = useState<{
    isOpen: boolean;
    sprintId: string;
    sprintTitle: string;
  }>({
    isOpen: false,
    sprintId: '',
    sprintTitle: ''
  });

  const { 
    sprints, 
    loading, 
    error, 
    addStory, 
    toggleStory, 
    moveStory, 
    getSprintStats,
    refreshData 
  } = useSupabaseStories();

  const handleAddSprint = () => {
    console.log('Add Sprint clicked');
    // Will implement in Sprint 2
  };

  const handleOpenSettings = () => {
    console.log('Settings clicked');
    // Will implement in Sprint 4
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

  const handleCloseAddStoryModal = () => {
    setAddStoryModal({
      isOpen: false,
      sprintId: '',
      sprintTitle: ''
    });
  };

  const handleSubmitStory = (sprintId: string, title: string, description: string, tags: string[]) => {
    addStory(sprintId, title, description, tags);
  };

  const handleOpenSprint = (sprintId: string) => {
    console.log('Open Sprint clicked for sprint:', sprintId);
    // Will implement in Sprint 4
  };

  const handleCloseSprint = (sprintId: string, type: 'completed' | 'all') => {
    console.log('Close Sprint clicked for sprint:', sprintId, 'type:', type);
    // Will implement in Sprint 5
  };

  const handleToggleStory = (storyId: string) => {
    toggleStory(storyId);
  };

  const handleMoveStory = (storyId: string, destinationSprintId: string, newPosition: number) => {
    moveStory(storyId, destinationSprintId, newPosition);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-canvas flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-text-secondary">Loading your sprint board...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
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
              : error
            }
          </p>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-devsuite-primary text-text-inverse rounded-lg hover:bg-devsuite-primary-hover transition-colors mx-auto"
          >
            <Database className="w-4 h-4" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-bg-canvas">
        <Header
          activeView={activeView}
          onViewChange={setActiveView}
          onAddSprint={handleAddSprint}
          onOpenSettings={handleOpenSettings}
        />
        
        {activeView === 'active' ? (
          <DragDropSprintBoard
            sprints={sprints}
            getSprintStats={getSprintStats}
            onAddStory={handleAddStory}
            onOpenSprint={handleOpenSprint}
            onCloseSprint={handleCloseSprint}
            onToggleStory={handleToggleStory}
            onMoveStory={handleMoveStory}
          />
        ) : (
          <div className="p-6 max-w-none mx-auto">
            <h1 className="text-3xl font-bold text-text-primary mb-8">Archive</h1>
            <div className="bg-bg-primary border border-border-default rounded-xl p-8 text-center">
              <p className="text-text-tertiary">Archive view will be implemented in Sprint 5</p>
            </div>
          </div>
        )}

        <AddStoryModal
          isOpen={addStoryModal.isOpen}
          sprintId={addStoryModal.sprintId}
          sprintTitle={addStoryModal.sprintTitle}
          onClose={handleCloseAddStoryModal}
          onSubmit={handleSubmitStory}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;