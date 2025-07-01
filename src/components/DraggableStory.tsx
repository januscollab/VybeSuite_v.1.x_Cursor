import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Story } from '../types';
import { PulsingDotsLoader } from './LoadingSpinner';

interface DraggableStoryProps {
  story: Story;
  index: number;
  onToggle: (storyId: string) => void;
  onEdit?: (story: Story) => void;
  isToggling?: boolean;
}

export const DraggableStory: React.FC<DraggableStoryProps> = ({
  story,
  index,
  onToggle,
  onEdit,
  isToggling = false
}) => {
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isToggling) {
      onToggle(story.id);
    }
  };

  const handleStoryClick = (e: React.MouseEvent) => {
    // Only trigger edit if we're not clicking on the checkbox
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).closest('button')) {
      return;
    }
    
    if (onEdit) {
      onEdit(story);
    }
  };

  return (
    <Draggable draggableId={story.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          onClick={handleStoryClick}
          className={`story-item ${
            snapshot.isDragging 
              ? 'shadow-devsuite-hover border-devsuite-primary bg-bg-primary transform rotate-2' 
              : ''
          } ${isToggling ? 'opacity-75' : ''} ${onEdit ? 'cursor-pointer' : ''}`}
        >
          <div {...provided.dragHandleProps} className="drag-handle">
            <div className="drag-dot"></div>
            <div className="drag-dot"></div>
            <div className="drag-dot"></div>
            <div className="drag-dot"></div>
          </div>
          
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`w-4 h-4 border-2 rounded flex-shrink-0 flex items-center justify-center transition-all cursor-pointer relative ${
              story.completed
                ? 'bg-success border-success text-text-inverse hover:bg-success-dark'
                : 'border-border-strong bg-bg-primary hover:border-devsuite-primary hover:bg-devsuite-primary/5'
            } ${isToggling ? 'cursor-not-allowed' : ''}`}
          >
            {isToggling ? (
              <PulsingDotsLoader size="sm" className="w-2 h-2" />
            ) : story.completed ? (
              <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : null}
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="font-medium text-text-primary text-sm flex-shrink-0">
              {story.number}
            </span>
            <span className={`text-sm flex-1 truncate ${
              story.completed ? 'line-through text-text-quaternary' : 'text-text-secondary'
            }`}>
              {story.title}
            </span>
          </div>

          <span className="text-xs text-text-quaternary flex-shrink-0">
            {story.date}
          </span>
        </div>
      )}
    </Draggable>
  );
};