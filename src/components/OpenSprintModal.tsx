import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, Play } from 'lucide-react';
import { Sprint, Story } from '../types';
import { usePromptManager } from '../utils/promptService';

interface OpenSprintModalProps {
  isOpen: boolean;
  sprint: Sprint;
  onClose: () => void;
}

export const OpenSprintModal: React.FC<OpenSprintModalProps> = ({
  isOpen,
  sprint,
  onClose
}) => {
  const [prompt, setPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const { getOpenSprintPrompt } = usePromptManager();

  // Generate the prompt when modal opens
  useEffect(() => {
    if (isOpen && sprint) {
      const openStories = sprint.stories.filter(story => !story.completed);
      const generatedPrompt = getOpenSprintPrompt({
        sprintTitle: sprint.title,
        stories: openStories.map(story => ({
          number: story.number,
          title: story.title,
          description: story.description || 'No description provided'
        }))
      });
      setPrompt(generatedPrompt);
    }
  }, [isOpen, sprint, getOpenSprintPrompt]);

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

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      // Auto-close modal after successful copy
      onClose();
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = prompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      // Auto-close modal after successful copy
      onClose();
    }
  };

  if (!isOpen) return null;

  const openStories = sprint.stories.filter(story => !story.completed);

  return (
    <div 
      className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-bg-primary rounded-xl shadow-devsuite-modal border border-border-default w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-default relative">
          <div className="flex items-center gap-3 mb-2">
            <Play className="w-6 h-6 text-devsuite-primary" />
            <h1 className="text-2xl font-bold text-text-primary">Open Sprint: {sprint.title}</h1>
          </div>
          <p className="text-base text-text-tertiary leading-6">
            {openStories.length} open {openStories.length === 1 ? 'story' : 'stories'} ready for development
          </p>
          <button
            onClick={onClose}
            className="absolute top-3 right-5 w-8 h-8 border-none bg-transparent cursor-pointer rounded-md flex items-center justify-center text-text-quaternary hover:bg-bg-canvas hover:text-text-secondary transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(95vh-200px)]">
          {openStories.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">All Stories Completed!</h3>
              <p className="text-text-tertiary">
                This sprint has no open stories. All stories have been marked as completed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Generated Prompt - Now First */}
              <div>
                <label htmlFor="sprintPrompt" className="block font-semibold text-sm mb-2 text-text-primary">
                  Development Prompt
                  <span className="font-normal text-text-tertiary ml-2">
                    (Edit as needed before copying)
                  </span>
                </label>
                <textarea
                  id="sprintPrompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-96 px-4 py-3 border border-border-default rounded-lg bg-bg-primary text-text-primary font-mono text-sm resize-vertical focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
                  placeholder="Generated prompt will appear here..."
                />
                <div className="text-xs text-text-tertiary mt-2">
                  This prompt includes all open stories and follows the standard format for development handoff.
                </div>
              </div>

              {/* Stories Summary */}
              <div className="bg-bg-muted rounded-lg p-4">
                <h3 className="font-semibold text-text-primary mb-3">Stories to be included:</h3>
                <div className="space-y-2">
                  {openStories.map((story) => (
                    <div key={story.id} className="flex items-start gap-3 p-2 bg-bg-primary rounded border border-border-subtle">
                      <span className="font-medium text-devsuite-primary text-sm flex-shrink-0">
                        {story.number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{story.title}</p>
                        {story.description && (
                          <p className="text-xs text-text-tertiary mt-1 line-clamp-2">{story.description}</p>
                        )}
                        {story.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {story.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-block px-2 py-0.5 bg-devsuite-primary-subtle text-devsuite-primary text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border-default flex justify-between items-center">
          <div className="text-sm text-text-tertiary">
            {openStories.length > 0 && (
              <>Ready to copy prompt for {openStories.length} open {openStories.length === 1 ? 'story' : 'stories'}</>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-transparent text-text-secondary text-sm font-medium cursor-pointer border border-border-default rounded-lg transition-all hover:bg-bg-muted hover:text-text-primary"
            >
              Cancel
            </button>
            
            {openStories.length > 0 && (
              <button
                onClick={handleCopyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-devsuite-primary text-text-inverse text-sm font-medium cursor-pointer border border-devsuite-primary rounded-lg transition-all hover:bg-devsuite-primary-hover"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Prompt
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};