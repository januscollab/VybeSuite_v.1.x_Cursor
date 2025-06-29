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
    // Sort by position, with Priority Sprint always first, backlog always last
    const aPos = a.id === 'priority' ? -1 : (a.isBacklog ? 1000 : (a.position || 0));
    const bPos = b.id === 'priority' ? -1 : (b.isBacklog ? 1000 : (b.position || 0));
    return aPos - bPos;
  });

  const prioritySprint = sortedSprints.find(s => s.id === 'priority');
  const userSprints = sortedSprints.filter(s => s.id !== 'priority' && !s.isBacklog);
  const backlogSprint = sortedSprints.find(s => s.isBacklog);

  // Combine Priority Sprint with user sprints for unified grid layout
  const allNonBacklogSprints = prioritySprint ? [prioritySprint, ...userSprints] : userSprints;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <main className="p-6 max-w-none mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Sprint Board</h1>
        
        {/* 
          ALL NON-BACKLOG SPRINTS - UNIFIED 2-COLUMN GRID
          Priority Sprint + User Sprints all follow the 50% width rule
          Priority Sprint is always first, user sprints can fill remaining slots
        */}
        {allNonBacklogSprints.length > 0 && (
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
                  2-COLUMN GRID FOR ALL NON-BACKLOG SPRINTS - ENFORCES 50% WIDTH RULE
                  Each sprint occupies exactly one column (50% width)
                */}
                <div className="grid grid-cols-2 gap-5">
                  {allNonBacklogSprints.map((sprint, index) => {
                    // Only user sprints are draggable, not Priority Sprint
                    const isDraggableSpring = sprint.id !== 'priority' && sprint.isDraggable;
                    
                    return isDraggableSpring ? (
                      <Draggable key={sprint.id} draggableId={sprint.id} index={index - 1} type="sprint">
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
                            isDraggable={isDraggableSpring}
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
                    ) : (
                      // Priority Sprint - not draggable
                      <DroppableSprintCard
                        key={sprint.id}
                        id={sprint.id}
                        title={sprint.title}
                        icon={sprint.icon}
                        stories={sprint.stories}
                        stats={getSprintStats(sprint.id)}
                        isDraggable={false}
                        operationLoading={operationLoading}
                        onAddStory={() => onAddStory(sprint.id)}
                        onOpenSprint={() => onOpenSprint(sprint.id)}
                        onCloseSprint={(type) => onCloseSprint(sprint.id, type)}
                        onDeleteSprint={() => onDeleteSprint(sprint.id)}
                        onToggleStory={onToggleStory}
                      />
                    );
                  })}
                  
                  {/* 
                    FILL EMPTY SPACE IF ODD NUMBER OF NON-BACKLOG SPRINTS
                    Ensures grid layout remains consistent
                  */}
                  {allNonBacklogSprints.length % 2 === 1 && <div></div>}
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