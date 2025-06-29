import { AIProvider } from '../types';

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'ChatGPT',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo'
    ]
  },
  {
    id: 'anthropic',
    name: 'Claude',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ]
  }
];

export const DEFAULT_AI_SETTINGS = {
  openaiApiKey: '',
  anthropicApiKey: '',
  defaultProvider: 'openai' as const,
  selectedOpenAIModel: 'gpt-4o',
  selectedAnthropicModel: 'claude-3-5-sonnet-20241022'
};

export const AI_STORAGE_KEY = 'devsuite_ai_settings';