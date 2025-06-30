import React, { useState } from 'react';
import { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { Droppable } from '@hello-pangea/dnd';
import { validateSprintLayout } from '../constants/layout';
import { Plus, Play, FileText, GripVertical, Trash2, X } from 'lucide-react';
import { DraggableStory } from './DraggableStory';
import { DeleteSprintConfirmation } from './DeleteSprintConfirmation';
import { Story, SprintStats } from '../types';

interface DroppableSprintCardProps {
  id: string;
  title: string;
  icon: string;
  stories: Story[];
  stats: SprintStats;
  isBacklog?: boolean;
  isDraggable?: boolean;
  operationLoading?: Record<string, boolean>;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  onAddStory: () => void;
  onOpenSprint: () => void;
  onCloseSprint: (type: 'completed' | 'all') => void;
  onDeleteSprint?: () => void;
  onToggleStory: (storyId: string) => void;
  onEditStory?: (story: Story) => void;
  onCloseBoard?: () => void;
}

export const DroppableSprintCard: React.FC<DroppableSprintCardProps> = ({
  id,
  title,
  icon,
  stories,
  stats,
  isBacklog = false,
  isDraggable = false,
  operationLoading = {},
  dragHandleProps,
  onAddStory,
  onOpenSprint,
  onCloseSprint,
  onDeleteSprint,
  onToggleStory,
  onEditStory,
  onCloseBoard
}) => {
  const [showCloseDropdown, setShowCloseDropdown] = useState(false);
  const [dropdownTimeout, setDropdownTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleMouseEnterClose = () => {
    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout);
      setDropdownTimeout(null);
    }
    setShowCloseDropdown(true);
  };

  const handleMouseLeaveClose = () => {
    const timeout = setTimeout(() => {
      setShowCloseDropdown(false);
    }, 150); // Small delay to prevent flickering
    setDropdownTimeout(timeout);
  };

  const handleCloseSprint = (sprintId: string, type: 'completed' | 'all') => {
    console.log('Close Sprint clicked for sprint:', sprintId, 'type:', type);
    onCloseSprint(sprintId, type);
    setShowCloseDropdown(false);
  };

  const handleDeleteSprint = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirmation(false);
    if (onDeleteSprint) {
      onDeleteSprint();
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const isSprintLoading = operationLoading[`close-sprint-${id}`];
  const isDeleteLoading = operationLoading[`delete-sprint-${id}`];
  
  // CRITICAL: Apply layout rules validation for sprint behavior
  const layoutRules = validateSprintLayout({ id, isBacklog });
  const isPrioritySprint = id === 'priority';
  const isBacklogSprint = isBacklog;
  const isUserGeneratedSprint = layoutRules.isDeletable && !isBacklogSprint; // Backlog is never deletable

  return (
    <div className={`bg-bg-primary border rounded-xl p-6 shadow-devsuite transition-all hover:shadow-devsuite-hover hover:border-border-strong relative ${
      isPrioritySprint 
        ? 'border-devsuite-primary border-2 bg-gradient-to-br from-bg-primary to-devsuite-primary-subtle' 
        : isBacklogSprint
        ? 'border-devsuite-primary border-2 bg-gradient-to-br from-bg-primary to-devsuite-primary-subtle'  // Same styling as Priority Sprint
        : 'border-border-default'
    }`}>
      {/* Close Button for Priority Sprint */}
      {isPrioritySprint && onCloseBoard && (
        <button
          onClick={onCloseBoard}
          className="absolute top-3 right-3 w-8 h-8 border-none bg-transparent cursor-pointer rounded-md flex items-center justify-center text-text-quaternary hover:bg-bg-canvas hover:text-text-secondary transition-all"
          title="Close Priority Sprint Board"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Sprint Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {layoutRules.isDraggable && dragHandleProps && (
              <div {...dragHandleProps}>
                <GripVertical className="w-4 h-4 text-text-quaternary cursor-grab hover:text-devsuite-primary transition-colors" />
              </div>
            )}
            <span className="text-base">{icon}</span>
            <h3 className={`font-semibold text-lg ${
              isPrioritySprint ? 'text-devsuite-primary' : 'text-text-primary'
            } ${
              isBacklogSprint ? 'text-devsuite-primary' : ''
            }`}>
              {title}
            </h3>
            {isPrioritySprint && (
              <span className="px-2 py-0.5 bg-devsuite-primary text-text-inverse text-xs font-medium rounded-full">
                LOCKED
              </span>
            )}
            {isBacklogSprint && (
              <span className="px-2 py-0.5 bg-devsuite-secondary text-text-inverse text-xs font-medium rounded-full">
                FUTURE ENHANCEMENTS
              </span>
            )}
          </div>
          
          <div className="flex gap-4 text-sm text-text-tertiary">
            <div className="flex items-center gap-1">
              <span>○</span>
              <span>{stats.todo} To Do</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⚡</span>
              <span>{stats.inProgress} In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <span>✓</span>
              <span>{stats.done} Done</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={`flex items-center gap-1.5 ${isPrioritySprint ? 'mr-10' : ''}`}>
          <button
            onClick={onAddStory}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary hover:bg-devsuite-primary/10 hover:text-devsuite-primary rounded-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Story
          </button>

          <button
            onClick={onOpenSprint}
            disabled={stats.todo === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-text-secondary hover:bg-devsuite-primary/10 hover:text-devsuite-primary disabled:hover:bg-transparent disabled:hover:text-text-secondary"
          >
            <Play className="w-4 h-4" />
            Open
          </button>

          {/* Only show Close button if NOT a backlog sprint and NOT priority sprint */}
          {/* STORY-003: Restore Close button for Priority and Backlog sprints */}
          {!isPrioritySprint && (
            <div className="relative">
              <button
                onMouseEnter={handleMouseEnterClose}
                onMouseLeave={handleMouseLeaveClose}
                disabled={isSprintLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-text-secondary hover:bg-devsuite-primary/10 hover:text-devsuite-primary disabled:hover:bg-transparent disabled:hover:text-text-secondary"
              >
                <FileText className="w-4 h-4" />
                Close
                <span className="text-xs">▼</span>
              </button>

              {showCloseDropdown && (
                <div 
                  className="absolute top-full right-0 mt-1 bg-bg-primary border border-border-default rounded-lg shadow-devsuite-hover z-50 min-w-44 overflow-hidden"
                  onMouseEnter={handleMouseEnterClose}
                  onMouseLeave={handleMouseLeaveClose}
                >
                  <button
                    onClick={() => {
                      handleCloseSprint(id, 'completed');
                    }}
                    disabled={stats.done === 0 || isSprintLoading}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm transition-colors border-b border-border-subtle disabled:opacity-50 disabled:cursor-not-allowed disabled:text-text-disabled disabled:hover:bg-transparent disabled:hover:text-text-disabled text-text-secondary hover:bg-bg-muted hover:text-text-primary"
                  >
                    Close Completed
                  </button>
                  <button
                    onClick={() => {
                      handleCloseSprint(id, 'all');
                    }}
                    disabled={isSprintLoading}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-muted hover:text-text-primary transition-colors disabled:opacity-50"
                  >
                    Close All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CRITICAL: Delete Button - ONLY for User-Generated Sprints (NEVER backlog or priority) */}
      {isUserGeneratedSprint && (
        <button
          onClick={handleDeleteSprint}
          disabled={isDeleteLoading || stories.length > 0}
          title={stories.length > 0 ? "Move or archive all stories before deleting" : "Delete sprint"}
          className="absolute bottom-3 left-3 p-1.5 text-error hover:text-error-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* CRITICAL: Stories - Droppable Area with TWO-COLUMN layout for backlog */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[100px] transition-colors ${
              snapshot.isDraggingOver 
                ? 'bg-devsuite-primary-subtle border-2 border-dashed border-devsuite-primary rounded-lg p-2' 
                : ''
            } ${isBacklog ? 'grid grid-cols-1 lg:grid-cols-2 gap-2' : 'space-y-2'}`}  // CRITICAL: Two-column layout for backlog ONLY
          >
            {stories.map((story, index) => (
              <DraggableStory
                key={story.id}
                story={story}
                index={index}
                onToggle={onToggleStory}
                onEdit={onEditStory}
                isToggling={operationLoading[`toggle-story-${story.id}`]}
              />
            ))}
            {provided.placeholder}
            
            {/* CRITICAL: Empty state with different messages for backlog vs regular sprints */}
            {stories.length === 0 && (
              <div className="flex items-center justify-center py-8 text-text-quaternary">
                <div className="text-center">
                  <div className="text-2xl mb-2">{isBacklogSprint ? '💡' : '📝'}</div>
                  <p className="text-sm">{isBacklogSprint ? 'No future enhancements yet' : 'No stories yet'}</p>
                  <p className="text-xs">{isBacklogSprint ? 'Add ideas for future development' : 'Drag stories here or click "Add Story"'}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Droppable>

      {/* Delete Confirmation Modal */}
      <DeleteSprintConfirmation
        isOpen={showDeleteConfirmation}
        sprintTitle={title}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};