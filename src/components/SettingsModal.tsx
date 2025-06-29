import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { AISettings } from '../types';
import { AI_PROVIDERS } from '../constants/ai';
import { validateApiKey } from '../utils/aiSettings';
import { testConnection, AIServiceError } from '../utils/aiService';

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
    openai: { success: boolean; error?: string } | null;
    anthropic: { success: boolean; error?: string } | null;
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
      setConnectionResults(prev => ({ 
        ...prev, 
        [provider]: { success: false, error: 'Invalid API key format' }
      }));
      return;
    }

    setTestingConnections(prev => ({ ...prev, [provider]: true }));
    setConnectionResults(prev => ({ ...prev, [provider]: null }));

    try {
      const success = await testConnection(provider, apiKey, model);
      setConnectionResults(prev => ({ 
        ...prev, 
        [provider]: { success }
      }));
    } catch (error) {
      let errorMessage = 'Connection failed';
      
      if (error instanceof AIServiceError) {
        if (error.isCorsError) {
          errorMessage = 'CORS restriction - use backend proxy in production';
        } else {
          errorMessage = error.message;
        }
      }
      
      console.error(`${provider} connection test failed:`, error);
      setConnectionResults(prev => ({ 
        ...prev, 
        [provider]: { success: false, error: errorMessage }
      }));
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

  const getConnectionStatus = (provider: 'openai' | 'anthropic') => {
    if (testingConnections[provider]) {
      return <Loader2 className="w-3 h-3 animate-spin text-text-quaternary" />;
    }
    
    const result = connectionResults[provider];
    if (result?.success) {
      return <div className="w-2 h-2 bg-success rounded-full" title="Connection successful"></div>;
    }
    if (result && !result.success) {
      return (
        <div 
          className="w-2 h-2 bg-error rounded-full" 
          title={result.error || 'Connection failed'}
        ></div>
      );
    }
    return null;
  };

  if (!isOpen) return null;

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
        <div className="px-8 py-6 border-b border-border-default relative">
          <h1 className="text-2xl font-bold text-text-primary mb-2">AI Configuration</h1>
          <p className="text-text-tertiary">Configure your AI providers and manage API credentials</p>
          <button
            onClick={onClose}
            className="absolute top-6 right-8 w-6 h-6 border-none bg-transparent cursor-pointer rounded-md flex items-center justify-center text-text-quaternary hover:text-text-secondary transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-8 py-6 overflow-y-auto max-h-[calc(95vh-180px)]">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Security Warning */}
            <div className="bg-warning-light border border-warning rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-warning-dark mt-0.5">🔒</div>
                <div>
                  <h3 className="font-semibold text-warning-dark text-sm mb-1">Security Notice:</h3>
                  <p className="text-warning-dark text-sm leading-relaxed">
                    API keys are stored locally in your browser. For production environments, consider implementing a secure backend proxy to protect your credentials.
                  </p>
                </div>
              </div>
            </div>

            {/* Default AI Provider Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 text-text-secondary">⚙️</div>
                <h3 className="text-lg font-semibold text-text-primary">Default AI Provider</h3>
              </div>
              
              {/* Provider Selection Tabs */}
              <div className="bg-bg-muted rounded-lg p-1 flex">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, defaultProvider: 'openai' }))}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    formData.defaultProvider === 'openai'
                      ? 'bg-bg-primary text-text-primary shadow-sm border border-border-subtle'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {getConnectionStatus('openai')}
                  <span>ChatGPT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, defaultProvider: 'anthropic' }))}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    formData.defaultProvider === 'anthropic'
                      ? 'bg-bg-primary text-text-primary shadow-sm border border-border-subtle'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {getConnectionStatus('anthropic')}
                  <span>Claude</span>
                </button>
              </div>
            </div>

            {/* Dynamic Configuration Section */}
            {formData.defaultProvider === 'anthropic' && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-5 h-5 text-text-secondary">🤖</div>
                  <h3 className="text-lg font-semibold text-text-primary">Claude Configuration</h3>
                </div>
                
                {/* Anthropic API Key */}
                <div className="mb-6">
                  <label htmlFor="anthropicApiKey" className="block text-sm font-medium text-text-primary mb-2">
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
                      className="w-full px-3 py-3 pr-12 border border-border-default rounded-lg bg-bg-primary text-text-primary transition-all focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 placeholder-text-placeholder font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-text-quaternary hover:text-text-secondary transition-colors"
                    >
                      {showAnthropicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-devsuite-primary">
                      Get your API key from Anthropic Console
                    </p>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleTestConnection('anthropic')}
                        disabled={!formData.anthropicApiKey || testingConnections.anthropic}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary border border-border-default rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🔍 Test Connection
                      </button>
                      {connectionResults.anthropic && !connectionResults.anthropic.success && (
                        <p className="text-xs text-error max-w-48 text-right">
                          {connectionResults.anthropic.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Anthropic Model Selection */}
                <div>
                  <label htmlFor="anthropicModel" className="block text-sm font-medium text-text-primary mb-2">
                    Model
                  </label>
                  <select
                    id="anthropicModel"
                    value={formData.selectedAnthropicModel}
                    onChange={(e) => setFormData(prev => ({ ...prev, selectedAnthropicModel: e.target.value }))}
                    className="w-full px-3 py-3 border border-border-default rounded-lg bg-bg-primary text-text-primary transition-all focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 cursor-pointer appearance-none"
                  >
                    {getModels('anthropic').map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {formData.defaultProvider === 'openai' && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-5 h-5 text-text-secondary">🤖</div>
                  <h3 className="text-lg font-semibold text-text-primary">ChatGPT Configuration</h3>
                </div>
                
                {/* OpenAI API Key */}
                <div className="mb-6">
                  <label htmlFor="openaiApiKey" className="block text-sm font-medium text-text-primary mb-2">
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
                      className="w-full px-3 py-3 pr-12 border border-border-default rounded-lg bg-bg-primary text-text-primary transition-all focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 placeholder-text-placeholder font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-text-quaternary hover:text-text-secondary transition-colors"
                    >
                      {showOpenAIKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-devsuite-primary">
                      Get your API key from OpenAI Platform
                    </p>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleTestConnection('openai')}
                        disabled={!formData.openaiApiKey || testingConnections.openai}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary border border-border-default rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🔍 Test Connection
                      </button>
                      {connectionResults.openai && !connectionResults.openai.success && (
                        <p className="text-xs text-error max-w-48 text-right">
                          {connectionResults.openai.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* OpenAI Model Selection */}
                <div>
                  <label htmlFor="openaiModel" className="block text-sm font-medium text-text-primary mb-2">
                    Model
                  </label>
                  <select
                    id="openaiModel"
                    value={formData.selectedOpenAIModel}
                    onChange={(e) => setFormData(prev => ({ ...prev, selectedOpenAIModel: e.target.value }))}
                    className="w-full px-3 py-3 border border-border-default rounded-lg bg-bg-primary text-text-primary transition-all focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 cursor-pointer appearance-none"
                  >
                    {getModels('openai').map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-4 border-t border-border-default flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded-lg hover:bg-bg-muted hover:text-text-primary transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-devsuite-primary text-text-inverse text-sm font-medium rounded-lg hover:bg-devsuite-primary-hover transition-all"
          >
            💾 Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};