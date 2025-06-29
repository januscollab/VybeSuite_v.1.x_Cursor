export interface Story {
  id: string;
  number: string;
  title: string;
  description?: string;
  completed: boolean;
  date: string;
  tags: string[];
  sprintId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  title: string;
  icon: string;
  isBacklog?: boolean;
  isDraggable?: boolean;
  stories: Story[];
}

export interface SprintStats {
  todo: number;
  inProgress: number;
  done: number;
}

export interface AddStoryFormData {
  title: string;
  description: string;
  tags: string[];
}

export interface AISettings {
  openaiApiKey: string;
  anthropicApiKey: string;
  defaultProvider: 'openai' | 'anthropic';
  selectedOpenAIModel: string;
  selectedAnthropicModel: string;
}

export interface AIProvider {
  id: 'openai' | 'anthropic';
  name: string;
  models: string[];
}

export interface AIGenerationRequest {
  provider: 'openai' | 'anthropic';
  model: string;
  prompt: string;
  apiKey: string;
}

export interface AIGenerationResponse {
  title: string;
  description: string;
  tags: string[];
}