import React, { useState } from 'react';
import { Draggable, Droppable, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { Plus, Play, FileText, GripVertical, CheckCircle, Archive, MoreVertical, Trash2, X } from 'lucide-react';
import { StoryCard } from './StoryCard';
import { validateSprintLayout } from '../constants/layout';
import { Sprint, Story, SprintStats } from '../types';

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
    onCloseSprint(type);
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

          {/* FIXED: Show Close button for ALL sprints except Backlog (including Priority Sprint) */}
          {!isBacklogSprint && (
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
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm transition-colors hover:bg-bg-canvas disabled:opacity-50 disabled:cursor-not-allowed text-left"
                  >
                    <CheckCircle className="w-4 h-4 text-success" />
                    <div>
                      <div className="font-medium text-text-primary">Close Completed</div>
                      <div className="text-xs text-text-tertiary">Archive {stats.done} completed stories</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleCloseSprint(id, 'all');
                    }}
                    disabled={isSprintLoading}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm transition-colors hover:bg-bg-canvas disabled:opacity-50 disabled:cursor-not-allowed text-left border-t border-border-subtle"
                  >
                    <Archive className="w-4 h-4 text-text-quaternary" />
                    <div>
                      <div className="font-medium text-text-primary">Close All</div>
                      <div className="text-xs text-text-tertiary">Archive all {stats.total} stories</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Delete button for user-generated sprints only */}
          {isUserGeneratedSprint && (
            <div className="relative">
              <button
                onClick={handleDeleteSprint}
                disabled={isDeleteLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary hover:bg-error/10 hover:text-error rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Delete confirmation modal */}
              {showDeleteConfirmation && (
                <div className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center p-5">
                  <div className="bg-bg-primary rounded-xl shadow-devsuite-modal border border-border-default w-full max-w-md">
                    <div className="px-6 py-4 border-b border-border-default">
                      <h3 className="text-lg font-semibold text-text-primary">Delete Sprint</h3>
                      <p className="text-text-tertiary">Are you sure you want to delete "{title}"? This action cannot be undone.</p>
                    </div>
                    <div className="px-6 py-4 flex justify-end gap-3">
                      <button
                        onClick={handleCancelDelete}
                        className="px-4 py-2 text-text-secondary hover:bg-bg-canvas rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmDelete}
                        disabled={isDeleteLoading}
                        className="px-4 py-2 bg-error text-text-inverse rounded-lg hover:bg-error-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Sprint
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stories Section */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-20 transition-colors ${
              snapshot.isDraggingOver ? 'bg-devsuite-primary/5 border-2 border-dashed border-devsuite-primary/20 rounded-lg' : ''
            } ${
              isBacklogSprint ? 'grid grid-cols-2 gap-3' : 'space-y-3'
            }`}
          >
            {stories.map((story, index) => (
              <Draggable key={story.id} draggableId={story.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={snapshot.isDragging ? 'rotate-3 z-50' : ''}
                  >
                    <StoryCard
                      story={story}
                      dragHandleProps={provided.dragHandleProps}
                      onToggle={onToggleStory}
                      onEdit={onEditStory}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {stories.length === 0 && (
              <div className="text-center py-8 text-text-quaternary">
                <div className="w-12 h-12 bg-bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                  <Plus className="w-6 h-6" />
                </div>
                <p className="text-sm">No stories yet</p>
                <p className="text-xs">Click "Add Story" to get started</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};