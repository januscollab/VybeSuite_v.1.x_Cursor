import React, { useState } from 'react';
import { Header } from './components/Header';
import { SprintBoard } from './components/SprintBoard';
import { AddStoryModal } from './components/AddStoryModal';
import { useStories } from './hooks/useStories';

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

  const { sprints, addStory, toggleStory, getSprintStats } = useStories();

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

  return (
    <div className="min-h-screen bg-bg-canvas">
      <Header
        activeView={activeView}
        onViewChange={setActiveView}
        onAddSprint={handleAddSprint}
        onOpenSettings={handleOpenSettings}
      />
      
      {activeView === 'active' ? (
        <SprintBoard
          sprints={sprints}
          getSprintStats={getSprintStats}
          onAddStory={handleAddStory}
          onOpenSprint={handleOpenSprint}
          onCloseSprint={handleCloseSprint}
          onToggleStory={handleToggleStory}
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
  );
}

export default App;