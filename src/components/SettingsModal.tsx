import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { AISettings } from '../types';
import { AI_PROVIDERS } from '../constants/ai';
import { validateApiKey } from '../utils/aiSettings';
import { testConnection } from '../utils/aiService';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AISettings;
  onClose: () => void;
  onSave: (settings: AISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<AISettings>(settings);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [testingConnections, setTestingConnections] = useState<{
    openai: boolean;
    anthropic: boolean;
  }>({ openai: false, anthropic: false });
  const [connectionResults, setConnectionResults] = useState<{
    openai: boolean | null;
    anthropic: boolean | null;
  }>({ openai: null, anthropic: null });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
      setConnectionResults({ openai: null, anthropic: null });
    }
  }, [isOpen, settings]);

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
    onSave(formData);
    onClose();
  };

  const handleTestConnection = async (provider: 'openai' | 'anthropic') => {
    const apiKey = provider === 'openai' ? formData.openaiApiKey : formData.anthropicApiKey;
    const model = provider === 'openai' ? formData.selectedOpenAIModel : formData.selectedAnthropicModel;

    if (!validateApiKey(provider, apiKey)) {
      setConnectionResults(prev => ({ ...prev, [provider]: false }));
      return;
    }

    setTestingConnections(prev => ({ ...prev, [provider]: true }));
    setConnectionResults(prev => ({ ...prev, [provider]: null }));

    try {
      const success = await testConnection(provider, apiKey, model);
      setConnectionResults(prev => ({ ...prev, [provider]: success }));
    } catch (error) {
      console.error(`${provider} connection test failed:`, error);
      setConnectionResults(prev => ({ ...prev, [provider]: false }));
    } finally {
      setTestingConnections(prev => ({ ...prev, [provider]: false }));
    }
  };

  const getProviderName = (providerId: 'openai' | 'anthropic') => {
    return AI_PROVIDERS.find(p => p.id === providerId)?.name || providerId;
  };

  const getModels = (providerId: 'openai' | 'anthropic') => {
    return AI_PROVIDERS.find(p => p.id === providerId)?.models || [];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center p-5">
      <div className="bg-bg-primary rounded-xl shadow-devsuite-modal border border-border-default w-full max-w-[600px] max-h-[95vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-default relative">
          <h1 className="text-2xl font-bold text-text-primary mb-0">AI Settings</h1>
          <p className="text-base text-text-tertiary leading-6">Configure your AI providers and API keys</p>
          <button
            onClick={onClose}
            className="absolute top-3 right-5 w-8 h-8 border-none bg-transparent cursor-pointer rounded-md flex items-center justify-center text-text-quaternary hover:bg-bg-canvas hover:text-text-secondary transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(95vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Security Warning */}
            <div className="bg-warning-light border border-warning rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-warning-dark mt-0.5">⚠️</div>
                <div>
                  <h3 className="font-semibold text-warning-dark text-sm mb-1">Security Notice</h3>
                  <p className="text-warning-dark text-xs leading-relaxed">
                    API keys are stored locally in your browser. For production use, consider implementing a backend proxy to keep your keys secure.
                  </p>
                </div>
              </div>
            </div>

            {/* Default Provider Selection */}
            <div>
              <label className="block font-semibold text-[13px] mb-2 text-text-primary">
                Default AI Provider
              </label>
              <div className="grid grid-cols-2 gap-3">
                {AI_PROVIDERS.map((provider) => (
                  <label
                    key={provider.id}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.defaultProvider === provider.id
                        ? 'border-devsuite-primary bg-devsuite-primary-subtle'
                        : 'border-border-default bg-bg-primary hover:border-border-interactive'
                    }`}
                  >
                    <input
                      type="radio"
                      name="defaultProvider"
                      value={provider.id}
                      checked={formData.defaultProvider === provider.id}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        defaultProvider: e.target.value as 'openai' | 'anthropic' 
                      }))}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                      formData.defaultProvider === provider.id
                        ? 'border-devsuite-primary bg-devsuite-primary'
                        : 'border-border-strong'
                    }`}>
                      {formData.defaultProvider === provider.id && (
                        <div className="w-2 h-2 bg-text-inverse rounded-full"></div>
                      )}
                    </div>
                    <span className="font-medium text-text-primary">{provider.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* OpenAI Configuration */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-text-primary border-b border-border-subtle pb-2">
                ChatGPT (OpenAI) Configuration
              </h3>
              
              {/* OpenAI API Key */}
              <div>
                <label htmlFor="openaiApiKey" className="block font-semibold text-[13px] mb-1 text-text-primary">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    id="openaiApiKey"
                    type={showOpenAIKey ? 'text' : 'password'}
                    value={formData.openaiApiKey}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, openaiApiKey: e.target.value }));
                      setConnectionResults(prev => ({ ...prev, openai: null }));
                    }}
                    placeholder="sk-..."
                    className="w-full px-3 py-2.5 pr-20 border-2 border-border-default rounded-lg bg-bg-primary text-[13px] text-text-primary transition-all focus:outline-none focus:border-devsuite-primary focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)] placeholder-text-placeholder font-mono"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {connectionResults.openai !== null && (
                      <div className="flex items-center">
                        {connectionResults.openai ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <XCircle className="w-4 h-4 text-error" />
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                      className="p-1 text-text-quaternary hover:text-text-secondary transition-colors"
                    >
                      {showOpenAIKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-[11px] text-text-tertiary">
                    Get your API key from{' '}
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-devsuite-primary hover:underline"
                    >
                      OpenAI Platform
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestConnection('openai')}
                    disabled={!formData.openaiApiKey || testingConnections.openai}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-text-secondary hover:text-devsuite-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {testingConnections.openai ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    Test Connection
                  </button>
                </div>
              </div>

              {/* OpenAI Model Selection */}
              <div>
                <label htmlFor="openaiModel" className="block font-semibold text-[13px] mb-1 text-text-primary">
                  ChatGPT Model
                </label>
                <select
                  id="openaiModel"
                  value={formData.selectedOpenAIModel}
                  onChange={(e) => setFormData(prev => ({ ...prev, selectedOpenAIModel: e.target.value }))}
                  className="w-full px-3 py-2.5 border-2 border-border-default rounded-lg bg-bg-primary text-[13px] text-text-primary transition-all focus:outline-none focus:border-devsuite-primary focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)] cursor-pointer appearance-none"
                >
                  {getModels('openai').map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Anthropic Configuration */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-text-primary border-b border-border-subtle pb-2">
                Claude (Anthropic) Configuration
              </h3>
              
              {/* Anthropic API Key */}
              <div>
                <label htmlFor="anthropicApiKey" className="block font-semibold text-[13px] mb-1 text-text-primary">
                  Anthropic API Key
                </label>
                <div className="relative">
                  <input
                    id="anthropicApiKey"
                    type={showAnthropicKey ? 'text' : 'password'}
                    value={formData.anthropicApiKey}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, anthropicApiKey: e.target.value }));
                      setConnectionResults(prev => ({ ...prev, anthropic: null }));
                    }}
                    placeholder="sk-ant-..."
                    className="w-full px-3 py-2.5 pr-20 border-2 border-border-default rounded-lg bg-bg-primary text-[13px] text-text-primary transition-all focus:outline-none focus:border-devsuite-primary focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)] placeholder-text-placeholder font-mono"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {connectionResults.anthropic !== null && (
                      <div className="flex items-center">
                        {connectionResults.anthropic ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <XCircle className="w-4 h-4 text-error" />
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                      className="p-1 text-text-quaternary hover:text-text-secondary transition-colors"
                    >
                      {showAnthropicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-[11px] text-text-tertiary">
                    Get your API key from{' '}
                    <a 
                      href="https://console.anthropic.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-devsuite-primary hover:underline"
                    >
                      Anthropic Console
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestConnection('anthropic')}
                    disabled={!formData.anthropicApiKey || testingConnections.anthropic}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-text-secondary hover:text-devsuite-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {testingConnections.anthropic ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    Test Connection
                  </button>
                </div>
              </div>

              {/* Anthropic Model Selection */}
              <div>
                <label htmlFor="anthropicModel" className="block font-semibold text-[13px] mb-1 text-text-primary">
                  Claude Model
                </label>
                <select
                  id="anthropicModel"
                  value={formData.selectedAnthropicModel}
                  onChange={(e) => setFormData(prev => ({ ...prev, selectedAnthropicModel: e.target.value }))}
                  className="w-full px-3 py-2.5 border-2 border-border-default rounded-lg bg-bg-primary text-[13px] text-text-primary transition-all focus:outline-none focus:border-devsuite-primary focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)] cursor-pointer appearance-none"
                >
                  {getModels('anthropic').map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border-default flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-transparent text-text-secondary text-[13px] font-medium cursor-pointer border border-border-default rounded-lg transition-all hover:bg-bg-muted hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 bg-devsuite-primary text-text-inverse text-[13px] font-medium cursor-pointer border border-devsuite-primary rounded-lg transition-all hover:bg-devsuite-primary-hover"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};