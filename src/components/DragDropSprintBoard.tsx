import React from 'react';
import { DragDropContext, DropResult, Droppable, Draggable } from '@hello-pangea/dnd';
import { DroppableSprintCard } from './DroppableSprintCard';
import { Sprint, SprintStats } from '../types';

interface DragDropSprintBoardProps {
  sprints: Sprint[];
  operationLoading?: Record<string, boolean>;
  getSprintStats: (sprintId: string) => SprintStats;
  onAddStory: (sprintId: string) => void;
  onOpenSprint: (sprintId: string) => void;
  onCloseSprint: (sprintId: string, type: 'completed' | 'all') => void;
  onDeleteSprint: (sprintId: string) => void;
  onToggleStory: (storyId: string) => void;
  onMoveStory: (storyId: string, destinationSprintId: string, newPosition: number) => void;
  onMoveSprint?: (sprintId: string, newPosition: number) => void;
}

export const DragDropSprintBoard: React.FC<DragDropSprintBoardProps> = ({
  sprints,
  operationLoading = {},
  getSprintStats,
  onAddStory,
  onOpenSprint,
  onCloseSprint,
  onDeleteSprint,
  onToggleStory,
  onMoveStory,
  onMoveSprint
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

    // Check if we're dragging a sprint or a story
    if (result.type === 'sprint') {
      // Handle sprint reordering
      if (onMoveSprint) {
        onMoveSprint(draggableId, destination.index);
      }
    } else {
      // Handle story movement
      onMoveStory(draggableId, destination.droppableId, destination.index);
    }

  };

  // Sort sprints by position to ensure Priority Sprint is always first
  const sortedSprints = [...sprints].sort((a, b) => {
    // Sort by position, with Priority Sprint always first
    const aPos = a.id === 'priority' ? -1 : (a.isBacklog ? 1000 : a.position || 0);
    const bPos = b.id === 'priority' ? -1 : (b.isBacklog ? 1000 : b.position || 0);
    return aPos - bPos;
  });

  const prioritySprint = sortedSprints.find(s => s.id === 'priority');
  const draggableSprints = sortedSprints.filter(s => s.id !== 'priority' && !s.isBacklog);
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
              onDeleteSprint={() => onDeleteSprint(prioritySprint.id)}
              onToggleStory={onToggleStory}
            />
          </div>
        )}
        
        {/* Draggable Sprints */}
        {draggableSprints.length > 0 && (
          <Droppable droppableId="sprints" type="sprint" direction="vertical">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-5 mb-5 transition-colors ${
                  snapshot.isDraggingOver ? 'bg-devsuite-primary-subtle/30 rounded-lg p-4' : ''
                }`}
              >
                {draggableSprints.map((sprint, index) => (
                  <Draggable key={sprint.id} draggableId={sprint.id} index={index} type="sprint">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`transition-all ${
                          snapshot.isDragging ? 'transform rotate-1 scale-105 z-50' : ''
                        }`}
                      >
                        <DroppableSprintCard
                          id={sprint.id}
                          title={sprint.title}
                          icon={sprint.icon}
                          stories={sprint.stories}
                          stats={getSprintStats(sprint.id)}
                          isDraggable={sprint.isDraggable}
                          operationLoading={operationLoading}
                          dragHandleProps={provided.dragHandleProps}
                          onAddStory={() => onAddStory(sprint.id)}
                          onOpenSprint={() => onOpenSprint(sprint.id)}
                          onCloseSprint={(type) => onCloseSprint(sprint.id, type)}
                          onDeleteSprint={() => onDeleteSprint(sprint.id)}
                          onToggleStory={onToggleStory}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
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
            onDeleteSprint={() => onDeleteSprint(backlogSprint.id)}
            onToggleStory={onToggleStory}
          />
        )}
      </main>
    </DragDropContext>
  );
};