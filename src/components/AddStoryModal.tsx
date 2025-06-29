import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, Tag } from 'lucide-react';
import { AddStoryFormData } from '../types';

interface AddStoryModalProps {
  isOpen: boolean;
  sprintId: string;
  sprintTitle: string;
  onClose: () => void;
  onSubmit: (sprintId: string, title: string, description: string, tags: string[]) => void;
}

const predefinedTags = [
  'frontend', 'backend', 'api', 'ui', 'ux', 'database', 'testing', 
  'security', 'performance', 'mobile', 'responsive', 'authentication',
  'integration', 'feature', 'bugfix', 'enhancement', 'documentation'
];

export const AddStoryModal: React.FC<AddStoryModalProps> = ({
  isOpen,
  sprintId,
  sprintTitle,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<AddStoryFormData>({
    title: '',
    description: '',
    tags: []
  });
  const [newTag, setNewTag] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ title: '', description: '', tags: [] });
      setNewTag('');
      setIsGenerating(false);
    }
  }, [isOpen]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSubmit(sprintId, formData.title.trim(), formData.description.trim(), formData.tags);
      onClose();
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
    }
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleGenerateStory = async () => {
    setIsGenerating(true);
    
    // Mock AI generation with realistic delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockGeneratedStories = [
      {
        title: 'Implement user profile management system',
        description: 'Create a comprehensive user profile system that allows users to update their personal information, preferences, and account settings. Include validation, error handling, and real-time updates.',
        tags: ['frontend', 'backend', 'api', 'ux']
      },
      {
        title: 'Add real-time notification system',
        description: 'Develop a notification system that provides instant updates to users about important events, messages, and system alerts. Include push notifications and in-app notifications.',
        tags: ['realtime', 'notifications', 'websockets', 'feature']
      },
      {
        title: 'Optimize database query performance',
        description: 'Analyze and optimize slow database queries to improve application performance. Add proper indexing, query optimization, and caching strategies.',
        tags: ['database', 'performance', 'optimization', 'backend']
      },
      {
        title: 'Implement advanced search functionality',
        description: 'Create a powerful search system with filters, sorting, and autocomplete features. Include full-text search capabilities and search result highlighting.',
        tags: ['search', 'frontend', 'api', 'feature']
      },
      {
        title: 'Add comprehensive error handling',
        description: 'Implement robust error handling throughout the application with user-friendly error messages, logging, and recovery mechanisms.',
        tags: ['error-handling', 'ux', 'reliability', 'backend']
      }
    ];

    const randomStory = mockGeneratedStories[Math.floor(Math.random() * mockGeneratedStories.length)];
    
    setFormData(prev => ({
      ...prev,
      title: randomStory.title,
      description: randomStory.description,
      tags: randomStory.tags
    }));
    
    setIsGenerating(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center p-4">
      <div className="bg-bg-primary rounded-xl shadow-devsuite-modal border border-border-default w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Add New Story</h2>
            <p className="text-sm text-text-tertiary mt-1">Adding to: {sprintTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-quaternary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* AI Generate Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleGenerateStory}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-devsuite-tertiary text-text-inverse rounded-lg hover:bg-devsuite-tertiary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating Story...' : 'Generate Story with AI'}
              </button>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-2">
                Story Title *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a clear, actionable story title..."
                className="w-full px-3 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-devsuite-primary focus:border-transparent bg-bg-primary text-text-primary placeholder-text-placeholder"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide additional context, acceptance criteria, or implementation details..."
                rows={4}
                className="w-full px-3 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-devsuite-primary focus:border-transparent bg-bg-primary text-text-primary placeholder-text-placeholder resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Tags
              </label>
              
              {/* Current Tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-devsuite-primary-subtle text-devsuite-primary text-xs rounded-md"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-devsuite-primary-hover"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add New Tag */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(newTag);
                    }
                  }}
                  placeholder="Add a tag..."
                  className="flex-1 px-3 py-2 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-devsuite-primary focus:border-transparent bg-bg-primary text-text-primary placeholder-text-placeholder text-sm"
                />
                <button
                  type="button"
                  onClick={() => addTag(newTag)}
                  className="px-3 py-2 bg-devsuite-primary text-text-inverse rounded-lg hover:bg-devsuite-primary-hover transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Predefined Tags */}
              <div>
                <p className="text-xs text-text-tertiary mb-2">Quick add:</p>
                <div className="flex flex-wrap gap-1">
                  {predefinedTags
                    .filter(tag => !formData.tags.includes(tag))
                    .slice(0, 12)
                    .map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addTag(tag)}
                        className="px-2 py-1 text-xs bg-bg-muted text-text-secondary rounded border border-border-subtle hover:bg-devsuite-primary-subtle hover:text-devsuite-primary hover:border-devsuite-primary transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border-subtle bg-bg-secondary">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-muted rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.title.trim()}
            className="px-4 py-2 bg-devsuite-primary text-text-inverse rounded-lg hover:bg-devsuite-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Story
          </button>
        </div>
      </div>
    </div>
  );
};