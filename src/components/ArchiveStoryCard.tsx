import React from 'react';
import { RotateCcw, Calendar, Tag } from 'lucide-react';
import { Story } from '../types';

interface ArchiveStoryCardProps {
  story: Story;
  isSelected: boolean;
  onToggleSelection: () => void;
  onRestore: () => void;
  onViewDetails: () => void;
}

export const ArchiveStoryCard: React.FC<ArchiveStoryCardProps> = ({
  story,
  isSelected,
  onToggleSelection,
  onRestore,
  onViewDetails
}) => {
  return (
    <div 
      className={`bg-bg-primary border rounded-lg p-4 transition-all hover:shadow-sm cursor-pointer ${
      isSelected ? 'border-devsuite-primary bg-devsuite-primary-subtle' : 'border-border-default'
    }`}
      onClick={onViewDetails}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelection();
            }}
            className="w-4 h-4 text-devsuite-primary border-border-strong rounded focus:ring-devsuite-primary focus:ring-2"
          />
          <span className="font-medium text-text-primary text-sm">{story.number}</span>
          {story.completed && (
            <span className="text-xs bg-success-light text-success-dark px-2 py-0.5 rounded-full">
              Completed
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRestore();
          }}
          className="p-1.5 text-text-quaternary hover:text-success hover:bg-success-light rounded-md transition-all"
          title="Restore story"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <h4 className={`font-medium text-sm mb-2 line-clamp-2 ${
        story.completed ? 'line-through text-text-quaternary' : 'text-text-primary'
      }`}>
        {story.title}
      </h4>

      {/* Description */}
      {story.description && (
        <p className="text-xs text-text-tertiary mb-3 line-clamp-2">
          {story.description}
        </p>
      )}

      {/* Tags */}
      {story.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {story.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-muted text-text-secondary text-xs rounded-full"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
          {story.tags.length > 3 && (
            <span className="text-xs text-text-quaternary">
              +{story.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-quaternary">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Archived {story.archivedAt ? new Date(story.archivedAt).toLocaleDateString() : 'Unknown'}</span>
        </div>
        <span className="text-text-quaternary">Sprint: {story.sprintId}</span>
      </div>
    </div>
  );
};