import React from 'react';
import { DragDropContext, DropResult, Droppable, Draggable } from '@hello-pangea/dnd';
import { DroppableSprintCard } from './DroppableSprintCard';
import { Sprint, SprintStats } from '../types';

/**
 * SPRINT LAYOUT RULES - CRITICAL DESIGN REQUIREMENT
 * 
 * 1. ALL SPRINTS EXCEPT BACKLOG ARE ALWAYS 50% WIDTH
 * 2. Priority Sprint: ALWAYS 50% width, position 0, left side
 * 3. User-defined Sprints: ALWAYS 50% width, arranged in 2-column grid
 * 4. Backlog Sprint: ALWAYS full width, always last
 * 
 * This is a fundamental design rule that must NEVER be changed.
 * The 50% width constraint ensures consistent visual hierarchy and
 * prevents layout issues regardless of sprint count.
 */

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
        
        {/* 
          PRIORITY SPRINT SECTION - ALWAYS 50% WIDTH
          The Priority Sprint is always rendered first and takes exactly 50% width
        */}
        {prioritySprint && (
          <div className="grid grid-cols-2 gap-5 mb-5">
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
            {/* Empty space to maintain 50% width for Priority Sprint */}
            <div></div>
          </div>
        )}
        
        {/* 
          USER-DEFINED SPRINTS SECTION - ALL 50% WIDTH
          All user-defined sprints are arranged in a 2-column grid
          Each sprint takes exactly 50% width (one column)
        */}
        {draggableSprints.length > 0 && (
          <Droppable droppableId="sprints" type="sprint" direction="vertical">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`mb-5 transition-colors ${
                  snapshot.isDraggingOver ? 'bg-devsuite-primary-subtle/30 rounded-lg p-4' : ''
                }`}
              >
                {/* 
                  2-COLUMN GRID FOR USER SPRINTS - ENFORCES 50% WIDTH RULE
                  Each sprint occupies exactly one column (50% width)
                */}
                <div className="grid grid-cols-2 gap-5">
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
                  
                  {/* 
                    FILL EMPTY SPACE IF ODD NUMBER OF SPRINTS
                    Ensures grid layout remains consistent
                  */}
                  {draggableSprints.length % 2 === 1 && <div></div>}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}

        {/* 
          BACKLOG SPRINT SECTION - FULL WIDTH (EXCEPTION TO 50% RULE)
          The Backlog Sprint is the ONLY sprint that takes full width
          It's always rendered last
        */}
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