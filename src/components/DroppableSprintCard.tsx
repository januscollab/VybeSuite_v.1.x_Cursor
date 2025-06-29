import React, { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, Play, FileText, GripVertical } from 'lucide-react';
import { DraggableStory } from './DraggableStory';
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
  onAddStory: () => void;
  onOpenSprint: () => void;
  onCloseSprint: (type: 'completed' | 'all') => void;
  onToggleStory: (storyId: string) => void;
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
  onAddStory,
  onOpenSprint,
  onCloseSprint,
  onToggleStory
}) => {
  const [showCloseDropdown, setShowCloseDropdown] = useState(false);
  const [dropdownTimeout, setDropdownTimeout] = useState<NodeJS.Timeout | null>(null);

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

  const isSprintLoading = operationLoading[`close-sprint-${id}`];
  const isPrioritySprint = id === 'priority';

  return (
    <div className={`bg-bg-primary border rounded-xl p-6 shadow-devsuite transition-all hover:shadow-devsuite-hover hover:border-border-strong ${
      isPrioritySprint 
        ? 'border-devsuite-primary border-2 bg-gradient-to-br from-bg-primary to-devsuite-primary-subtle' 
        : 'border-border-default'
    } ${
      isBacklog ? 'col-span-full' : ''
    }`}>
      {/* Sprint Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isDraggable && !isPrioritySprint && (
              <GripVertical className="w-3 h-3 text-text-quaternary cursor-grab hover:text-devsuite-primary transition-colors" />
            )}
            <span className="text-base">{icon}</span>
            <h3 className={`font-semibold text-lg ${
              isPrioritySprint ? 'text-devsuite-primary' : 'text-text-primary'
            }`}>
              {title}
            </h3>
            {isPrioritySprint && (
              <span className="px-2 py-0.5 bg-devsuite-primary text-text-inverse text-xs font-medium rounded-full">
                LOCKED
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
        <div className="flex items-center gap-1.5">
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

          <div className="relative">
            <button
              onMouseEnter={handleMouseEnterClose}
              onMouseLeave={handleMouseLeaveClose}
              disabled={isSprintLoading || isPrioritySprint}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-text-secondary hover:bg-devsuite-primary/10 hover:text-devsuite-primary disabled:hover:bg-transparent disabled:hover:text-text-secondary"
            >
              <FileText className="w-4 h-4" />
              Close
              <span className="text-xs">▼</span>
            </button>

            {showCloseDropdown && !isPrioritySprint && (
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
        </div>
      </div>

      {/* Stories - Droppable Area */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[100px] transition-colors ${
              snapshot.isDraggingOver 
                ? 'bg-devsuite-primary-subtle border-2 border-dashed border-devsuite-primary rounded-lg p-2' 
                : ''
            } ${isBacklog ? 'grid grid-cols-1 lg:grid-cols-2 gap-2' : 'space-y-2'}`}
          >
            {stories.map((story, index) => (
              <DraggableStory
                key={story.id}
                story={story}
                index={index}
                onToggle={onToggleStory}
                isToggling={operationLoading[`toggle-story-${story.id}`]}
              />
            ))}
            {provided.placeholder}
            
            {/* Empty state */}
            {stories.length === 0 && (
              <div className="flex items-center justify-center py-8 text-text-quaternary">
                <div className="text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <p className="text-sm">No stories yet</p>
                  <p className="text-xs">Drag stories here or click "Add Story"</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};