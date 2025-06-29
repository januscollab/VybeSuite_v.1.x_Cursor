import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { DroppableSprintCard } from './DroppableSprintCard';
import { Sprint, SprintStats } from '../types';

interface DragDropSprintBoardProps {
  sprints: Sprint[];
  operationLoading?: Record<string, boolean>;
  getSprintStats: (sprintId: string) => SprintStats;
  onAddStory: (sprintId: string) => void;
  onOpenSprint: (sprintId: string) => void;
  onCloseSprint: (sprintId: string, type: 'completed' | 'all') => void;
  onToggleStory: (storyId: string) => void;
  onMoveStory: (storyId: string, destinationSprintId: string, newPosition: number) => void;
}

export const DragDropSprintBoard: React.FC<DragDropSprintBoardProps> = ({
  sprints,
  operationLoading = {},
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

  // Sort sprints by position to ensure Priority Sprint is always first
  const sortedSprints = [...sprints].sort((a, b) => {
    // Priority Sprint always comes first (position 0)
    if (a.id === 'priority') return -1;
    if (b.id === 'priority') return 1;
    // Then sort by position
    return a.id === 'backlog' ? 1 : b.id === 'backlog' ? -1 : 0;
  });

  const prioritySprint = sortedSprints.find(s => s.id === 'priority');
  const otherSprints = sortedSprints.filter(s => s.id !== 'priority' && !s.isBacklog);
  const backlogSprint = sortedSprints.find(s => s.isBacklog);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <main className="p-6 max-w-none mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Sprint Board</h1>
        
        {/* Priority Sprint - Always First */}
        {prioritySprint && (
          <div className="mb-5">
            <DroppableSprintCard
              id={prioritySprint.id}
              title={prioritySprint.title}
              icon={prioritySprint.icon}
              stories={prioritySprint.stories}
              stats={getSprintStats(prioritySprint.id)}
              operationLoading={operationLoading}
              onAddStory={() => onAddStory(prioritySprint.id)}
              onOpenSprint={() => onOpenSprint(prioritySprint.id)}
              onCloseSprint={(type) => onCloseSprint(prioritySprint.id, type)}
              onToggleStory={onToggleStory}
            />
          </div>
        )}
        
        {/* Other Sprints */}
        {otherSprints.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {otherSprints.map(sprint => (
              <DroppableSprintCard
                key={sprint.id}
                id={sprint.id}
                title={sprint.title}
                icon={sprint.icon}
                stories={sprint.stories}
                stats={getSprintStats(sprint.id)}
                isDraggable={sprint.isDraggable}
                operationLoading={operationLoading}
                onAddStory={() => onAddStory(sprint.id)}
                onOpenSprint={() => onOpenSprint(sprint.id)}
                onCloseSprint={(type) => onCloseSprint(sprint.id, type)}
                onToggleStory={onToggleStory}
              />
            ))}
          </div>
        )}

        {/* Backlog Sprint - Always Last */}
        {backlogSprint && (
          <DroppableSprintCard
            id={backlogSprint.id}
            title={backlogSprint.title}
            icon={backlogSprint.icon}
            stories={backlogSprint.stories}
            stats={getSprintStats(backlogSprint.id)}
            isBacklog={backlogSprint.isBacklog}
            operationLoading={operationLoading}
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