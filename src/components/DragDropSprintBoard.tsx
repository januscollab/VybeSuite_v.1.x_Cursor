import React from 'react';
import { DragDropContext, DropResult, Droppable, Draggable } from '@hello-pangea/dnd';
import { DroppableSprintCard } from './DroppableSprintCard';
import { Sprint, SprintStats, Story } from '../types';

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
  onEditStory?: (story: Story) => void;
  onCloseBoard?: () => void;
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
  onMoveSprint,
  onEditStory,
  onCloseBoard
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
    // Enhanced sorting: Priority Sprint first, then by position, Backlog always last
    const getSprintPriority = (sprint: Sprint) => {
      if (sprint.id === 'priority') return -1000; // Always first
      if (sprint.isBacklog) return 1000; // Always last
      return sprint.position || 0; // Normal position for user sprints
    };
    
    const aPos = getSprintPriority(a);
    const bPos = getSprintPriority(b);
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
          <Droppable droppableId="sprints" type="sprint" direction="horizontal">
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
                    const isDraggableSprint = sprint.id !== 'priority' && sprint.isDraggable && !sprint.isBacklog;
                    
                    return isDraggableSprint ? (
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
                            isDraggable={isDraggableSprint}
                            operationLoading={operationLoading}
                            dragHandleProps={provided.dragHandleProps}
                            onAddStory={() => onAddStory(sprint.id)}
                            onOpenSprint={() => onOpenSprint(sprint.id)}
                            onCloseSprint={(type) => onCloseSprint(sprint.id, type)}
                            onDeleteSprint={() => onDeleteSprint(sprint.id)}
                            onToggleStory={onToggleStory}
                            onEditStory={onEditStory}
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
                        onEditStory={onEditStory}
                        onCloseBoard={sprint.id === 'priority' ? onCloseBoard : undefined}
                      />
                    );
                  })}
                  
                  {/* 
                    FILL EMPTY SPACE IF ODD NUMBER OF NON-BACKLOG SPRINTS
                    Ensures 2-column grid layout remains consistent
                  */}
                  {allNonBacklogSprints.length % 2 === 1 && <div></div>}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}

        {/* 
          BACKLOG - FUTURE ENHANCEMENTS SPRINT - FULL WIDTH WITH TWO-COLUMN STORIES
          CRITICAL: This sprint is ALWAYS positioned last and uses the FULL page width
          Stories are displayed in a two-column layout for better visibility
          CRITICAL REQUIREMENTS:
          - ALWAYS 100% page width
          - ALWAYS two columns of stories
          - ALWAYS same color as Priority Sprint (devsuite-primary styling)
          - NEVER draggable or deletable
        */}
        {backlogSprint && (
          <div className="w-full">  {/* CRITICAL: Full width container for backlog */}
            <DroppableSprintCard
              id={backlogSprint.id}
              title={backlogSprint.title}
              icon={backlogSprint.icon}
              stories={backlogSprint.stories}
              stats={getSprintStats(backlogSprint.id)}
              isBacklog={true}  // Explicitly set to true for backlog sprint
              operationLoading={operationLoading}
              isDraggable={false}  // Explicitly prevent dragging
              onAddStory={() => onAddStory(backlogSprint.id)}
              onOpenSprint={() => onOpenSprint(backlogSprint.id)}
              onCloseSprint={(type) => onCloseSprint(backlogSprint.id, type)}
              onDeleteSprint={undefined}  // Prevent deletion by not providing handler
              onToggleStory={onToggleStory}
              onEditStory={onEditStory}
            />
          </div>
        )}
      </main>
    </DragDropContext>
  );
};