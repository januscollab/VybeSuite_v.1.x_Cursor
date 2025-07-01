import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Plus, Star, Trash2, Save } from 'lucide-react';
import { AddStoryFormData, AISettings, Story } from '../types';
import { generateStory, AIServiceError } from '../utils/aiService';
import { AI_PROVIDERS } from '../constants/ai';
import { usePrompts } from '../contexts/PromptContext';

interface StoryModalProps {
  isOpen: boolean;
  sprintId: string;
  sprintTitle: string;
  aiSettings: AISettings;
  story?: Story | null; // If provided, we're editing; if null/undefined, we're adding
  onClose: () => void;
  onSubmit: (sprintId: string, title: string, description: string, tags: string[]) => void;
  onUpdate?: (storyId: string, title: string, description: string, tags: string[]) => void;
  onDelete?: (storyId: string) => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({
  isOpen,
  sprintId,
  sprintTitle,
  aiSettings,
  story,
  onClose,
  onSubmit,
  onUpdate,
  onDelete
}) => {
  const isEditMode = !!story;
  
  const [formData, setFormData] = useState<AddStoryFormData>({
    title: '',
    description: '',
    tags: []
  });
  const [storyPrompt, setStoryPrompt] = useState('');
  const [priority, setPriority] = useState('medium');
  const [tagInput, setTagInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic'>(aiSettings.defaultProvider);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [includeGithubCodeReview, setIncludeGithubCodeReview] = useState(false);
  const [aiGenerationWarning, setAiGenerationWarning] = useState(false);

  const { getStoryGenerationPrompt } = usePrompts();

  // Reset form when modal opens/closes or story changes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ title: '', description: '', tags: [] });
      setStoryPrompt('');
      setPriority('medium');
      setTagInput('');
      setIsGenerating(false);
      setGenerationError(null);
      setSelectedProvider(aiSettings.defaultProvider);
      setShowDeleteConfirmation(false);
      setIncludeGithubCodeReview(false);
      setAiGenerationWarning(false);
    } else if (isEditMode && story) {
      // Pre-populate form with existing story data
      setFormData({
        title: story.title,
        description: story.description || '',
        tags: story.tags || []
      });
      setStoryPrompt('');
    } else {
      // Reset for add mode
      setFormData({ title: '', description: '', tags: [] });
    }
  }, [isOpen, isEditMode, story, aiSettings.defaultProvider]);

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
      if (isEditMode && story && onUpdate) {
        onUpdate(story.id, formData.title.trim(), formData.description.trim(), formData.tags);
      } else {
        onSubmit(sprintId, formData.title.trim(), formData.description.trim(), formData.tags);
      }
      onClose();
    }
  };

  const handleCreateStory = () => {
    if (storyPrompt.trim()) {
      const title = formData.title.trim() || storyPrompt.trim();
      const description = formData.description.trim() || `Story created from prompt: ${storyPrompt.trim()}`;
      
      if (isEditMode && story && onUpdate) {
        onUpdate(story.id, title, description, formData.tags);
      } else {
        onSubmit(sprintId, title, description, formData.tags);
      }
      onClose();
    }
  };

  const handleDelete = () => {
    if (isEditMode && story && onDelete) {
      onDelete(story.id);
      onClose();
    }
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
      setTagInput('');
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.toLowerCase();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleGenerateStory = async () => {
    if (!storyPrompt.trim()) return;
    
    const apiKey = selectedProvider === 'openai' ? aiSettings.openaiApiKey : aiSettings.anthropicApiKey;
    const model = selectedProvider === 'openai' ? aiSettings.selectedOpenAIModel : aiSettings.selectedAnthropicModel;
    
    if (!apiKey) {
      setGenerationError(`Please configure your ${selectedProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API key in settings first.`);
      return;
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const systemPrompt = getStoryGenerationPrompt(selectedProvider, includeGithubCodeReview);
      
      const result = await generateStory({
        provider: selectedProvider,
        model,
        prompt: storyPrompt,
        apiKey,
        systemPrompt
      });
      
      setFormData(prev => ({
        ...prev,
        title: result.title,
        description: result.description,
        tags: [...new Set([...prev.tags, ...result.tags])]
      }));
      
      // Set warning if description seems AI-generated (short or generic)
      setAiGenerationWarning(
        result.description.length < 100 || 
        result.description.toLowerCase().includes('ai generated') ||
        result.description.toLowerCase().includes('generated by')
      );
    } catch (error) {
      console.error('AI generation error:', error);
      if (error instanceof AIServiceError) {
        setGenerationError(`${error.provider.toUpperCase()} Error: ${error.message}`);
      } else {
        setGenerationError('Failed to generate story. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getProviderName = (providerId: 'openai' | 'anthropic') => {
    return AI_PROVIDERS.find(p => p.id === providerId)?.name || providerId;
  };

  const hasValidApiKey = (providerId: 'openai' | 'anthropic') => {
    const apiKey = providerId === 'openai' ? aiSettings.openaiApiKey : aiSettings.anthropicApiKey;
    return apiKey && apiKey.trim().length > 0;
  };

  // Robot Running Animation Component
  const RobotRunner = ({ message = "Generating story..." }) => (
    <div className="robot-container">
      <div className="robot-runner">
        <div className="robot-head-run"></div>
        <div className="robot-body"></div>
        <div className="robot-leg left"></div>
        <div className="robot-leg right"></div>
        <div className="robot-arm left"></div>
        <div className="robot-arm right"></div>
      </div>
      <div className="robot-message">{message}</div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
    <div 
      className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-bg-primary rounded-xl shadow-devsuite-modal border border-border-default w-full max-w-[580px] max-h-[95vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-default relative">
          <h1 className="text-2xl font-bold text-text-primary mb-0">
            {isEditMode ? 'Edit Story' : 'Add New Story'}
          </h1>
          <p className="text-base text-text-tertiary leading-6">
            {isEditMode ? `Editing: ${story?.number}` : `Adding to: ${sprintTitle}`}
          </p>
          <button
            onClick={onClose}
            className="absolute top-3 right-5 w-8 h-8 border-none bg-transparent cursor-pointer rounded-md flex items-center justify-center text-text-quaternary hover:bg-bg-canvas hover:text-text-secondary transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(95vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Story Title */}
            <div className="mb-3">
              <label htmlFor="storyTitle" className="form-label-compact">
                Story Title <span className="text-error ml-0.5">*</span>
              </label>
              <input
                id="storyTitle"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter story title..."
                className="form-input-compact"
                required
              />
            </div>

            {/* Story Prompt - Only show in add mode */}
            {!isEditMode && (
              <div className="mb-3">
                <label htmlFor="storyPrompt" className="form-label-compact">
                  Story Prompt (AI Assistance)
                </label>
                
                {/* AI Provider Selection */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex gap-2">
                    {AI_PROVIDERS.map((provider) => (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => setSelectedProvider(provider.id)}
                        disabled={!hasValidApiKey(provider.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all flex-shrink-0 min-w-[70px] ${
                          selectedProvider === provider.id
                            ? 'bg-devsuite-primary text-text-inverse'
                            : hasValidApiKey(provider.id)
                            ? 'bg-bg-muted text-text-secondary hover:bg-devsuite-primary/10 hover:text-devsuite-primary'
                            : 'bg-bg-muted text-text-disabled cursor-not-allowed'
                        }`}
                      >
                        {provider.name}
                        {!hasValidApiKey(provider.id) && (
                          <AlertCircle className="w-3 h-3" />
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {/* GitHub Code Review Checkbox - Only show for Claude */}
                  {selectedProvider === 'anthropic' && (
                    <label className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeGithubCodeReview}
                        onChange={(e) => setIncludeGithubCodeReview(e.target.checked)}
                        className="w-3 h-3 text-devsuite-primary border-border-strong rounded focus:ring-devsuite-primary focus:ring-1"
                      />
                      include github code review
                    </label>
                  )}
                </div>
                
                <textarea
                  id="storyPrompt"
                  value={storyPrompt}
                  onChange={(e) => setStoryPrompt(e.target.value)}
                  placeholder="Describe what you want to build... (e.g., 'Create a user login form with email validation')"
                  className="form-input-compact resize min-h-[80px] max-h-[300px]"
                  style={{
                    resize: 'both',
                    minWidth: '100%',
                    maxWidth: '100%'
                  }}
                />
                
                {/* Generation Error */}
                {generationError && (
                  <div className="mt-1.5 p-2 bg-error-light border border-error rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-error-dark mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-error-dark">{generationError}</p>
                    </div>
                  </div>
                )}
                
                {storyPrompt.trim() && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={handleGenerateStory}
                      disabled={isGenerating || !hasValidApiKey(selectedProvider)}
                      className="btn-primary-action text-xs py-1.5 px-2.5"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                      {isGenerating ? 'Generating...' : `Generate with ${getProviderName(selectedProvider)}`}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleCreateStory}
                      disabled={isGenerating}
                      className="btn-primary-action text-xs py-1.5 px-2.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create Story
                    </button>
                  </div>
                )}
                
                {!hasValidApiKey(selectedProvider) && (
                  <div className="text-[11px] text-text-tertiary mt-1">
                    Configure your {getProviderName(selectedProvider)} API key in settings to use AI generation
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="mb-3">
              <label htmlFor="description" className="form-label-compact">
                Description
                {aiGenerationWarning && (
                  <span className="ml-2 text-xs text-warning-dark font-normal">
                    ⚠️ Consider expanding this description
                  </span>
                )}
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the story..."
                className={`form-input-compact resize-vertical min-h-[70px] ${
                  aiGenerationWarning 
                    ? 'border-warning focus:border-warning' 
                    : ''
                }`}
              />
              <div className="text-[11px] text-text-tertiary mt-0.5">
                {aiGenerationWarning 
                  ? 'AI-generated description may be incomplete. Please expand with detailed acceptance criteria and functional requirements.'
                  : 'Provide detailed requirements, acceptance criteria, and any additional context'
                }
              </div>
            </div>

            {/* Tags */}
            <div className="mb-3">
              <label htmlFor="tags" className="form-label-compact">
                Tags
              </label>
              <div className="border-2 border-border-default rounded-lg bg-bg-primary p-1.5 min-h-[40px] flex flex-wrap gap-1.5 items-start transition-all focus-within:border-devsuite-primary focus-within:shadow-[0_0_0_3px_rgba(252,128,25,0.1)]">
                {formData.tags.map((tag) => (
                  <div
                    key={tag}
                    className="bg-devsuite-primary-subtle text-devsuite-primary px-2 py-1 rounded-2xl text-xs font-medium flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="bg-transparent border-none text-devsuite-primary cursor-pointer p-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] leading-none hover:bg-devsuite-primary hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInput}
                  placeholder="Add tags (press Enter to add)..."
                  className="border-none outline-none bg-transparent flex-1 min-w-[100px] p-1.5 text-[13px] text-text-primary placeholder-text-placeholder"
                />
              </div>
              <div className="text-[11px] text-text-tertiary mt-0.5">
                Add relevant tags like frontend, backend, ui, api, etc.
              </div>
            </div>

            {/* Priority - Only show in add mode */}
            {!isEditMode && (
              <div className="mb-3">
                <label className="form-label-compact">Priority Level</label>
                <div className="priority-toggle">
                  <button
                    type="button"
                    onClick={() => setPriority('low')}
                    className={`priority-option ${priority === 'low' ? 'active' : ''}`}
                  >
                    🟢 Low
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('medium')}
                    className={`priority-option ${priority === 'medium' ? 'active' : ''}`}
                  >
                    🟡 Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('high')}
                    className={`priority-option ${priority === 'high' ? 'active' : ''}`}
                  >
                    🔴 High
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Delete Confirmation */}
          {showDeleteConfirmation && (
            <div className="mt-4 p-4 bg-error-light border border-error rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-error" />
                <h3 className="font-semibold text-error-dark">Delete Story</h3>
              </div>
              <p className="text-error-dark text-sm mb-4">
                Are you sure you want to delete this story? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="btn-primary-action bg-error hover:bg-error-dark"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Story
                </button>
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="btn-secondary-action"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border-default flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isEditMode && onDelete && (
              <button
                onClick={() => setShowDeleteConfirmation(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-error hover:bg-error-light text-[13px] font-medium cursor-pointer border border-error rounded-md transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary-action"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.title.trim()}
              className="btn-primary-action"
            >
              {isEditMode ? (
                <>
                  <Save className="w-4 h-4" />
                  Update Story
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Story
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>

    <style>{`
      /* Robot Running Animation for Generate Story */
      .robot-runner {
        position: relative;
        width: 80px;
        height: 60px;
        animation: robot-run 2s ease-in-out infinite;
      }

      .robot-body {
        position: absolute;
        bottom: 20px;
        left: 25px;
        width: 30px;
        height: 25px;
        background: var(--devsuite-primary);
        border-radius: 6px;
      }

      .robot-head-run {
        position: absolute;
        bottom: 40px;
        left: 30px;
        width: 20px;
        height: 20px;
        background: var(--devsuite-primary);
        border-radius: 4px;
      }

      .robot-head-run::before {
        content: '';
        position: absolute;
        top: 6px;
        left: 4px;
        width: 3px;
        height: 3px;
        background: var(--text-inverse);
        border-radius: 50%;
        box-shadow: 9px 0 0 var(--text-inverse);
      }

      .robot-leg {
        position: absolute;
        bottom: 5px;
        width: 6px;
        height: 18px;
        background: var(--devsuite-primary);
        border-radius: 3px;
        animation: leg-move 0.8s ease-in-out infinite;
      }

      .robot-leg.left { left: 30px; }
      .robot-leg.right { left: 44px; animation-delay: 0.4s; }

      .robot-arm {
        position: absolute;
        bottom: 30px;
        width: 4px;
        height: 15px;
        background: var(--devsuite-primary);
        border-radius: 2px;
        animation: arm-swing 0.8s ease-in-out infinite;
      }

      .robot-arm.left { left: 22px; }
      .robot-arm.right { left: 54px; animation-delay: 0.4s; }

      @keyframes robot-run {
        0%, 100% { transform: translateX(-10px); }
        50% { transform: translateX(10px); }
      }

      @keyframes leg-move {
        0%, 100% { transform: rotate(20deg); }
        50% { transform: rotate(-20deg); }
      }

      @keyframes arm-swing {
        0%, 100% { transform: rotate(-30deg); }
        50% { transform: rotate(30deg); }
      }

      .generate-button-loading {
        display: flex;
        align-items: center;
        gap: 12px;
        justify-content: center;
      }

      .robot-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .robot-message {
        font-size: 12px;
        color: var(--text-secondary);
        font-weight: 500;
      }
    `}</style>
    </>
  );
};