import React from 'react';
import { SprintCard } from './SprintCard';
import { Sprint, SprintStats } from '../types';

interface SprintBoardProps {
  sprints: Sprint[];
  getSprintStats: (sprintId: string) => SprintStats;
  onAddStory: (sprintId: string) => void;
  onOpenSprint: (sprintId: string) => void;
  onCloseSprint: (sprintId: string, type: 'completed' | 'all') => void;
  onToggleStory: (storyId: string) => void;
}

export const SprintBoard: React.FC<SprintBoardProps> = ({
  sprints,
  getSprintStats,
  onAddStory,
  onOpenSprint,
  onCloseSprint,
  onToggleStory
}) => {
  const prioritySprint = sprints.find(s => s.id === 'priority');
  const developmentSprint = sprints.find(s => s.id === 'development');
  const backlogSprint = sprints.find(s => s.id === 'backlog');

  return (
    <main className="p-6 max-w-none mx-auto">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Sprint Board</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {prioritySprint && (
          <SprintCard
            id={prioritySprint.id}
            title={prioritySprint.title}
            icon={prioritySprint.icon}
            stories={prioritySprint.stories}
            stats={getSprintStats(prioritySprint.id)}
            onAddStory={() => onAddStory(prioritySprint.id)}
            onOpenSprint={() => onOpenSprint(prioritySprint.id)}
            onCloseSprint={(type) => onCloseSprint(prioritySprint.id, type)}
            onToggleStory={onToggleStory}
          />
        )}

        {developmentSprint && (
          <SprintCard
            id={developmentSprint.id}
            title={developmentSprint.title}
            icon={developmentSprint.icon}
            stories={developmentSprint.stories}
            stats={getSprintStats(developmentSprint.id)}
            isDraggable={developmentSprint.isDraggable}
            onAddStory={() => onAddStory(developmentSprint.id)}
            onOpenSprint={() => onOpenSprint(developmentSprint.id)}
            onCloseSprint={(type) => onCloseSprint(developmentSprint.id, type)}
            onToggleStory={onToggleStory}
          />
        )}
      </div>

      {backlogSprint && (
        <SprintCard
          id={backlogSprint.id}
          title={backlogSprint.title}
          icon={backlogSprint.icon}
          stories={backlogSprint.stories}
          stats={getSprintStats(backlogSprint.id)}
          isBacklog={backlogSprint.isBacklog}
          onAddStory={() => onAddStory(backlogSprint.id)}
          onOpenSprint={() => onOpenSprint(backlogSprint.id)}
          onCloseSprint={(type) => onCloseSprint(backlogSprint.id, type)}
          onToggleStory={onToggleStory}
        />
      )}
    </main>
  );
};