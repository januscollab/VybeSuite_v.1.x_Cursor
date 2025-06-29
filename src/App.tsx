import React, { useState } from 'react';
import { Header } from './components/Header';
import { SprintBoard } from './components/SprintBoard';

function App() {
  const [activeView, setActiveView] = useState<'active' | 'archive'>('active');

  const handleAddSprint = () => {
    console.log('Add Sprint clicked');
    // Will implement in Sprint 2
  };

  const handleOpenSettings = () => {
    console.log('Settings clicked');
    // Will implement in Sprint 4
  };

  const handleAddStory = (sprintId: string) => {
    console.log('Add Story clicked for sprint:', sprintId);
    // Will implement in Sprint 2
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
    console.log('Toggle Story clicked for story:', storyId);
    // Will implement in Sprint 2
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
    </div>
  );
}

export default App;