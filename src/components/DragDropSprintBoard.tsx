import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { DroppableSprintCard } from './DroppableSprintCard';
import { Sprint, SprintStats } from '../types';

interface DragDropSprintBoardProps {
  sprints: Sprint[];
  getSprintStats: (sprintId: string) => SprintStats;
  onAddStory: (sprintId: string) => void;
  onOpenSprint: (sprintId: string) => void;
  onCloseSprint: (sprintId: string, type: 'completed' | 'all') => void;
  onToggleStory: (storyId: string) => void;
  onMoveStory: (storyId: string, destinationSprintId: string, newPosition: number) => void;
}

export const DragDropSprintBoard: React.FC<DragDropSprintBoardProps> = ({
  sprints,
  getSprintStats,
  onAddStory,
  onOpenSprint,
  onCloseSprint,
  onToggleStory,
  onMoveStory
}) => {
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If no destination, do nothing
    if (!destination) return;

    // If dropped in the same position, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Move the story
    onMoveStory(draggableId, destination.droppableId, destination.index);
  };

  const prioritySprint = sprints.find(s => s.id === 'priority');
  const developmentSprint = sprints.find(s => s.id === 'development');
  const backlogSprint = sprints.find(s => s.id === 'backlog');

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <main className="p-6 max-w-none mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Sprint Board</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {prioritySprint && (
            <DroppableSprintCard
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
            <DroppableSprintCard
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
          <DroppableSprintCard
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
    </DragDropContext>
  );
};