import React, { useEffect } from 'react';
import { X, RotateCcw, Calendar, Tag, CheckCircle, Clock } from 'lucide-react';
import { Story } from '../types';

interface StoryDetailModalProps {
  isOpen: boolean;
  story: Story | null;
  onClose: () => void;
  onRestore: (storyId: string) => void;
}

export const StoryDetailModal: React.FC<StoryDetailModalProps> = ({
  isOpen,
  story,
  onClose,
  onRestore
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !story) return null;

  const handleRestore = () => {
    onRestore(story.id);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-bg-primary rounded-xl shadow-devsuite-modal border border-border-default w-full max-w-[600px] max-h-[95vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-default relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-devsuite-primary text-sm">{story.number}</span>
              {story.completed && (
                <span className="flex items-center gap-1 text-xs bg-success-light text-success-dark px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Completed
                </span>
              )}
              {story.archivedAt && (
                <span className="flex items-center gap-1 text-xs bg-warning-light text-warning-dark px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  Archived
                </span>
              )}
            </div>
          </div>
          <h1 className="text-xl font-bold text-text-primary pr-8">{story.title}</h1>
          <button
            onClick={onClose}
            className="absolute top-3 right-5 w-8 h-8 border-none bg-transparent cursor-pointer rounded-md flex items-center justify-center text-text-quaternary hover:bg-bg-canvas hover:text-text-secondary transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(95vh-200px)]">
          <div className="space-y-6">
            {/* Story Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-text-quaternary" />
                <span className="text-text-tertiary">Created:</span>
                <span className="text-text-primary">{story.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-tertiary">Sprint:</span>
                <span className="text-text-primary">{story.sprintId}</span>
              </div>
              {story.completedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-text-tertiary">Completed:</span>
                  <span className="text-text-primary">
                    {new Date(story.completedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {story.archivedAt && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" />
                  <span className="text-text-tertiary">Archived:</span>
                  <span className="text-text-primary">
                    {new Date(story.archivedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {story.description && (
              <div>
                <h3 className="font-semibold text-text-primary mb-2">Description</h3>
                <div className="bg-bg-muted rounded-lg p-4">
                  <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                    {story.description}
                  </p>
                </div>
              </div>
            )}

            {/* Tags */}
            {story.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-text-primary mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {story.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-devsuite-primary-subtle text-devsuite-primary text-sm rounded-full"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Read-only Notice */}
            <div className="bg-info-light border border-info rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-info-dark mt-0.5">ℹ️</div>
                <div>
                  <h4 className="font-medium text-info-dark text-sm mb-1">Read-Only View</h4>
                  <p className="text-info-dark text-sm">
                    This story is archived and cannot be edited. Restore it to an active sprint to make changes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border-default flex justify-between items-center">
          <div className="text-sm text-text-tertiary">
            Story #{story.number} • {story.archivedAt ? 'Archived' : 'Active'}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded-lg hover:bg-bg-muted hover:text-text-primary transition-all"
            >
              Close
            </button>
            
            {story.archivedAt && (
              <button
                onClick={handleRestore}
                className="flex items-center gap-2 px-4 py-2 bg-success text-text-inverse text-sm font-medium rounded-lg hover:bg-success-dark transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Restore Story
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};