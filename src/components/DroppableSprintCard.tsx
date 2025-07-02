import { debug } from '../utils/debug';
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
// VERBOSE_LOGGING: Set to true only when debugging specific issues
const VERBOSE_LOGGING = false;
export const DroppableSprintCard: React.FC<DroppableSprintCardProps> = ({ id, title, icon, stories, stats, isBacklog = false, isDraggable = false, operationLoading = {}, dragHandleProps, onAddStory, onOpenSprint, onCloseSprint, onDeleteSprint, onToggleStory, onEditStory, onCloseBoard }) => {
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const handleCloseSprint = (type: 'completed' | 'all') => {
        if (VERBOSE_LOGGING) {
            debug.info("DroppableSprintCard", "Close Sprint clicked for sprint", { id, type });
        }
        onCloseSprint(type);
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
    // SPECIAL SPRINT IDENTIFICATION: Both Priority and Backlog are special sprints
    const isSpecialSprint = isPrioritySprint || isBacklogSprint;
    // TRIPLE PROTECTION: Priority Sprints should NEVER have delete buttons
    // This is a fundamental rule that must be enforced at multiple levels
    const isUserGeneratedSprint = layoutRules.isDeletable && !isBacklogSprint && !isPrioritySprint;
    // CRITICAL: Additional Priority Sprint protection - NEVER allow delete for priority sprints
    const canShowDeleteButton = isUserGeneratedSprint && id !== 'priority' && !isPrioritySprint && !isSpecialSprint;
    // DEBUG: Priority Sprint detection (disabled to reduce console noise)
    if (VERBOSE_LOGGING && isPrioritySprint) {
        debug.info("DroppableSprintCard", "🔒 Priority Sprint detected", { id, isPrioritySprint, isSpecialSprint });
    }
    return (<div className={`sprint-card bg-bg-primary border rounded-xl p-6 shadow-devsuite transition-all hover:shadow-devsuite-hover hover:border-border-strong relative ${isSpecialSprint
            ? 'border-devsuite-primary border-2 bg-gradient-to-br from-bg-primary to-devsuite-primary-subtle'
            : 'border-border-default'}`}>
      {/* Close Button for Priority Sprint */}
      {isPrioritySprint && onCloseBoard && (<button onClick={onCloseBoard} className="absolute top-3 right-3 w-8 h-8 border-none bg-transparent cursor-pointer rounded-md flex items-center justify-center text-text-quaternary hover:bg-bg-canvas hover:text-text-secondary transition-all" title="Close Priority Sprint Board">
          <X className="w-5 h-5"/>
        </button>)}

      {/* Glassmorphism Context Menu */}
      <div className="glassmorphism-context-menu">
        <button className="btn-glass btn-glass-primary" onClick={onAddStory} title="Add new story to this sprint">
          <Plus className="w-3.5 h-3.5"/>
          Add Story
        </button>
        
        {/* Hide Open button for Backlog sprint as per layout rules */}
        {!isBacklogSprint && (<button className="btn-glass btn-glass-secondary" onClick={onOpenSprint} disabled={stats.todo === 0} title={stats.todo === 0 ? "No stories to open" : "Open sprint"}>
            <Play className="w-3.5 h-3.5"/>
            Open Sprint
          </button>)}
        
        {/* Show Close button for ALL sprints except Backlog */}
        {!isBacklogSprint && (<button className="btn-glass btn-glass-neutral" onClick={() => handleCloseSprint('completed')} disabled={isSprintLoading || stats.done === 0} title={stats.done === 0 ? "No completed stories to close" : "Close completed stories"}>
            <FileText className="w-3.5 h-3.5"/>
            Close Stories
          </button>)}
      </div>

      {/* Sprint Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {layoutRules.isDraggable && dragHandleProps && (<div {...dragHandleProps} className="drag-handle">
                <div className="drag-dot"></div>
                <div className="drag-dot"></div>
                <div className="drag-dot"></div>
                <div className="drag-dot"></div>
              </div>)}
            <span className="text-base">{icon}</span>
            <h3 className={`font-semibold text-lg ${isSpecialSprint ? 'text-devsuite-primary' : 'text-text-primary'}`}>
              {title}
            </h3>
            {isPrioritySprint && (<span className="px-2 py-0.5 bg-devsuite-primary text-text-inverse text-xs font-medium rounded-full">
                LOCKED
              </span>)}
            {isBacklogSprint && (<span className="px-2 py-0.5 bg-devsuite-primary text-text-inverse text-xs font-medium rounded-full">
                FUTURE ENHANCEMENTS
              </span>)}
          </div>
          
          <div className="flex gap-2 text-sm text-text-tertiary">
            <div className="flex items-center gap-1 whitespace-nowrap">
              <span>○</span>
              <span>{stats.todo} To Do</span>
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <span>⚡</span>
              <span>{stats.inProgress} In Progress</span>
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <span>✓</span>
              <span>{stats.done} Done</span>
            </div>
          </div>
        </div>
      </div>

      {/* CRITICAL: Delete Button - ONLY for User-Generated Sprints (NEVER backlog or priority) */}
      {/* QUADRUPLE PROTECTION: Multiple checks to ensure Special Sprints NEVER get delete buttons */}
      {canShowDeleteButton && !isPrioritySprint && !isSpecialSprint && id !== 'priority' && (<button onClick={handleDeleteSprint} disabled={isDeleteLoading || stories.length > 0} title={stories.length > 0 ? "Move or archive all stories before deleting" : "Delete sprint"} className="absolute bottom-3 left-3 p-1.5 text-error hover:text-error-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <Trash2 className="w-4 h-4"/>
        </button>)}

      {/* CRITICAL: Stories - Droppable Area with TWO-COLUMN layout for backlog */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (<div ref={provided.innerRef} {...provided.droppableProps} className={`min-h-[100px] transition-colors ${snapshot.isDraggingOver
                ? 'bg-devsuite-primary-subtle border-2 border-dashed border-devsuite-primary rounded-lg p-2'
                : ''} ${isBacklog ? 'grid grid-cols-1 lg:grid-cols-2 gap-2' : 'space-y-2'}`} // CRITICAL: Two-column layout for backlog ONLY
        >
            {stories.map((story, index) => (<DraggableStory key={story.id} story={story} index={index} onToggle={onToggleStory} onEdit={onEditStory} isToggling={operationLoading[`toggle-story-${story.id}`]}/>))}
            {provided.placeholder}
            
            {/* CRITICAL: Empty state with different messages for backlog vs regular sprints */}
            {stories.length === 0 && (<div className="flex items-center justify-center py-8 text-text-quaternary">
                <div className="text-center">
                  <div className="text-2xl mb-2">{isBacklogSprint ? '💡' : '📝'}</div>
                  <p className="text-sm">{isBacklogSprint ? 'No future enhancements yet' : 'No stories yet'}</p>
                  <p className="text-xs">{isBacklogSprint ? 'Add ideas for future development' : 'Drag stories here or click "Add Story"'}</p>
                </div>
              </div>)}
          </div>)}
      </Droppable>

      {/* Delete Confirmation Modal */}
      <DeleteSprintConfirmation isOpen={showDeleteConfirmation} sprintTitle={title} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete}/>
    </div>);
};
