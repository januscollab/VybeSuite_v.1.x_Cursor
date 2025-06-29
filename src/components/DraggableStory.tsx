import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Story } from '../types';

interface DraggableStoryProps {
  story: Story;
  index: number;
  onToggle: (storyId: string) => void;
}

export const DraggableStory: React.FC<DraggableStoryProps> = ({
  story,
  index,
  onToggle
}) => {
  return (
    <Draggable draggableId={story.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-bg-secondary border border-border-subtle rounded-lg p-3 flex items-center gap-3 transition-all hover:bg-bg-muted hover:border-border-default hover:shadow-sm ${
            snapshot.isDragging 
              ? 'shadow-devsuite-hover border-devsuite-primary bg-bg-primary transform rotate-2' 
              : ''
          }`}
        >
          <span className="text-text-quaternary cursor-grab font-bold text-xs">::</span>
          
          <button
            onClick={() => onToggle(story.id)}
            className={`w-4 h-4 border-2 rounded flex-shrink-0 flex items-center justify-center transition-all ${
              story.completed
                ? 'bg-devsuite-secondary border-devsuite-secondary text-text-inverse'
                : 'border-border-strong bg-bg-primary hover:border-devsuite-primary'
            }`}
          >
            {story.completed && <span className="text-xs font-bold">✓</span>}
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