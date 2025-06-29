import React, { useState } from 'react';
import { RotateCcw, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { Sprint } from '../types';
import { ArchiveStoryCard } from './ArchiveStoryCard';

interface ArchiveSprintCardProps {
  sprint: Sprint;
  selectedStories: string[];
  onRestoreSprint: () => void;
  onRestoreStories: (storyIds: string[]) => void;
  onToggleStorySelection: (storyId: string) => void;
}

export const ArchiveSprintCard: React.FC<ArchiveSprintCardProps> = ({
  sprint,
  selectedStories,
  onRestoreSprint,
  onRestoreStories,
  onToggleStorySelection
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const completedStories = sprint.stories.filter(s => s.completed).length;
  const totalStories = sprint.stories.length;

  return (
    <div className="bg-bg-primary border border-border-default rounded-xl p-6 shadow-sm">
      {/* Sprint Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{sprint.icon}</span>
            <h3 className="font-semibold text-lg text-text-primary">{sprint.title}</h3>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-text-tertiary mb-2">
            <span>{totalStories} stories</span>
            <span>•</span>
            <span>{completedStories} completed</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                Archived {sprint.archivedAt ? new Date(sprint.archivedAt).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-bg-muted rounded-full h-2">
            <div 
              className="bg-success h-2 rounded-full transition-all"
              style={{ width: totalStories > 0 ? `${(completedStories / totalStories) * 100}%` : '0%' }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onRestoreSprint}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary hover:text-success hover:bg-success-light rounded-md transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Restore Sprint
          </button>
        </div>
      </div>

      {/* Stories Toggle */}
      {totalStories > 0 && (
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 w-full text-left text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {isExpanded ? 'Hide' : 'Show'} {totalStories} stories
          </button>

          {isExpanded && (
            <div className="mt-4 space-y-3">
              {/* Bulk Actions for Stories */}
              {sprint.stories.some(story => selectedStories.includes(story.id)) && (
                <div className="flex items-center gap-2 p-3 bg-devsuite-primary-subtle border border-devsuite-primary rounded-lg">
                  <span className="text-sm font-medium text-devsuite-primary">
                    {sprint.stories.filter(story => selectedStories.includes(story.id)).length} selected
                  </span>
                  <button
                    onClick={() => onRestoreStories(sprint.stories.filter(story => selectedStories.includes(story.id)).map(s => s.id))}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-success hover:bg-success-light rounded transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore Selected
                  </button>
                </div>
              )}

              {/* Stories Grid */}
              <div className="grid grid-cols-1 gap-3">
                {sprint.stories.map(story => (
                  <ArchiveStoryCard
                    key={story.id}
                    story={story}
                    isSelected={selectedStories.includes(story.id)}
                    onToggleSelection={() => onToggleStorySelection(story.id)}
                    onRestore={() => onRestoreStories([story.id])}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};