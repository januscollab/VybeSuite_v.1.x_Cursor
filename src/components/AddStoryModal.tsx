import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Plus, Star } from 'lucide-react';
import { AddStoryFormData, AISettings } from '../types';
import { generateStory, AIServiceError } from '../utils/aiService';
import { AI_PROVIDERS } from '../constants/ai';

interface AddStoryModalProps {
  isOpen: boolean;
  sprintId: string;
  sprintTitle: string;
  aiSettings: AISettings;
  onClose: () => void;
  onSubmit: (sprintId: string, title: string, description: string, tags: string[]) => void;
}

export const AddStoryModal: React.FC<AddStoryModalProps> = ({
  isOpen,
  sprintId,
  sprintTitle,
  aiSettings,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<AddStoryFormData>({
    title: '',
    description: '',
    tags: []
  });
  const [storyPrompt, setStoryPrompt] = useState('');
  const [priority, setPriority] = useState('medium');
  const [risk, setRisk] = useState('none');
  const [tagInput, setTagInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic'>(aiSettings.defaultProvider);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ title: '', description: '', tags: [] });
      setStoryPrompt('');
      setPriority('medium');
      setRisk('none');
      setTagInput('');
      setIsGenerating(false);
      setGenerationError(null);
      setSelectedProvider(aiSettings.defaultProvider);
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

  const handleCreateStory = () => {
    if (storyPrompt.trim()) {
      // Use the prompt as the title if no title is provided
      const title = formData.title.trim() || storyPrompt.trim();
      const description = formData.description.trim() || `Story created from prompt: ${storyPrompt.trim()}`;
      
      onSubmit(sprintId, title, description, formData.tags);
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
      const result = await generateStory({
        provider: selectedProvider,
        model,
        prompt: storyPrompt,
        apiKey
      });
      
      setFormData(prev => ({
        ...prev,
        title: result.title,
        description: result.description,
        tags: [...new Set([...prev.tags, ...result.tags])]
      }));
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
          <h1 className="text-2xl font-bold text-text-primary mb-0">Add New Story</h1>
          <p className="text-base text-text-tertiary leading-6">Adding to: {sprintTitle}</p>
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
              <label htmlFor="storyTitle" className="block font-semibold text-[13px] mb-1 text-text-primary">
                Story Title <span className="text-error ml-0.5">*</span>
              </label>
              <input
                id="storyTitle"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter story title..."
                className="w-full px-3 py-2.5 border-2 border-border-default rounded-lg bg-bg-primary text-[13px] text-text-primary transition-all focus:outline-none focus:border-devsuite-primary focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)] placeholder-text-placeholder font-inherit"
                required
              />
            </div>

            {/* Story Prompt */}
            <div className="mb-3">
              <label htmlFor="storyPrompt" className="block font-semibold text-[13px] mb-1 text-text-primary">
                Story Prompt (AI Assistance)
              </label>
              
              {/* AI Provider Selection */}
              <div className="flex gap-2 mb-2">
                {AI_PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setSelectedProvider(provider.id)}
                    disabled={!hasValidApiKey(provider.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
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
              
              <textarea
                id="storyPrompt"
                value={storyPrompt}
                onChange={(e) => setStoryPrompt(e.target.value)}
                placeholder="Describe what you want to build... (e.g., 'Create a user login form with email validation')"
                className="w-full px-3 py-2.5 border-2 border-border-default rounded-lg bg-bg-primary text-[13px] text-text-primary transition-all focus:outline-none focus:border-devsuite-primary focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)] placeholder-text-placeholder font-inherit resize min-h-[80px] max-h-[300px]"
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
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-devsuite-primary text-text-inverse text-xs font-medium cursor-pointer border border-devsuite-primary rounded-md transition-all hover:bg-devsuite-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Generating...' : `Generate with ${getProviderName(selectedProvider)}`}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleCreateStory}
                    disabled={isGenerating}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-devsuite-primary text-text-inverse text-xs font-medium cursor-pointer border border-devsuite-primary rounded-md transition-all hover:bg-devsuite-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Description */}
            <div className="mb-3">
              <label htmlFor="description" className="block font-semibold text-[13px] mb-1 text-text-primary">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the story..."
                className="w-full px-3 py-2.5 border-2 border-border-default rounded-lg bg-bg-primary text-[13px] text-text-primary transition-all focus:outline-none focus:border-devsuite-primary focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)] placeholder-text-placeholder font-inherit resize-vertical min-h-[70px]"
              />
              <div className="text-[11px] text-text-tertiary mt-0.5">
                Provide detailed requirements, acceptance criteria, and any additional context
              </div>
            </div>

            {/* Priority and Risk Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block font-semibold text-[13px] mb-1 text-text-primary">
                  Priority
                </label>
                <div className="relative">
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2.5 pr-9 border-2 border-border-default rounded-lg bg-bg-primary text-[13px] text-text-primary transition-all focus:outline-none focus:border-devsuite-primary focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)] cursor-pointer appearance-none font-inherit"
                  >
                    <option value="">Select priority...</option>
                    <option value="critical">🔴 Critical</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-quaternary pointer-events-none w-4 h-4 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </div>
              </div>

              {/* Risk Level */}
              <div>
                <label htmlFor="risk" className="block font-semibold text-[13px] mb-1 text-text-primary">
                  Risk (of Breaking Change)
                </label>
                <div className="relative">
                  <select
                    id="risk"
                    value={risk}
                    onChange={(e) => setRisk(e.target.value)}
                    className="w-full px-3 py-2.5 pr-9 border-2 border-border-default rounded-lg bg-bg-primary text-[13px] text-text-primary transition-all focus:outline-none focus:border-devsuite-primary focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)] cursor-pointer appearance-none font-inherit"
                  >
                    <option value="">Select risk level...</option>
                    <option value="high">⚠️ High - Major breaking changes expected</option>
                    <option value="medium">🟡 Medium - Some breaking changes possible</option>
                    <option value="low">✅ Low - Minimal impact expected</option>
                    <option value="none">🟢 None - Safe changes only</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-quaternary pointer-events-none w-4 h-4 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-3">
              <label htmlFor="tags" className="block font-semibold text-[13px] mb-1 text-text-primary">
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
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border-default flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 bg-transparent text-text-secondary text-[13px] font-medium cursor-pointer border border-border-default rounded-md transition-all hover:bg-bg-muted hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.title.trim()}
            className="flex items-center gap-1.5 px-3 py-2 bg-devsuite-primary text-text-inverse text-[13px] font-medium cursor-pointer border border-devsuite-primary rounded-md transition-all hover:bg-devsuite-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Create Story
          </button>
        </div>
      </div>
    </div>

    <style jsx>{`
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