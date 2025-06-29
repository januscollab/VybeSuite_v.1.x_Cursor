import { AISettings } from '../types';
import { DEFAULT_AI_SETTINGS, AI_STORAGE_KEY } from '../constants/ai';

export function loadAISettings(): AISettings {
  try {
    const stored = localStorage.getItem(AI_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_AI_SETTINGS,
        ...parsed
      };
    }
  } catch (error) {
    console.error('Error loading AI settings:', error);
  }
  return DEFAULT_AI_SETTINGS;
}

export function saveAISettings(settings: AISettings): void {
  try {
    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving AI settings:', error);
    throw new Error('Failed to save AI settings');
  }
}

export function clearAISettings(): void {
  try {
    localStorage.removeItem(AI_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing AI settings:', error);
  }
}

export function validateApiKey(provider: 'openai' | 'anthropic', apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') return false;
  
  if (provider === 'openai') {
    return apiKey.startsWith('sk-') && apiKey.length > 20;
  } else if (provider === 'anthropic') {
    return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
  }
  
  return false;
}