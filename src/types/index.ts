export interface Story {
  id: string;
  number: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string | null;
  date: string;
  tags: string[];
  sprintId: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface Sprint {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  icon: string;
  isBacklog?: boolean;
  isDraggable?: boolean;
  position?: number;
  stories: Story[];
  archivedAt?: string | null;
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
  systemPrompt?: string;
}

export interface AIGenerationResponse {
  title: string;
  description: string;
  tags: string[];
}

export interface SearchFilters {
  query: string;
  tags: string[];
  status: 'all' | 'completed' | 'todo';
  sprints: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

export interface ArchiveStats {
  totalStories: number;
  completedStories: number;
  totalSprints: number;
  archivedStories: number;
  archivedSprints: number;
}

export interface BulkAction {
  type: 'archive' | 'restore' | 'delete' | 'move' | 'tag';
  storyIds: string[];
  targetSprintId?: string;
  tags?: string[];
}

export interface ExportData {
  sprints: Sprint[];
  stories: Story[];
  exportedAt: string;
  filters?: SearchFilters;
}

export interface UserSettings {
  id: string;
  userId: string;
  storyNumberPrefix: string;
  preferredHomepage: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  settings: UserSettings;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  user_metadata: {
    first_name?: string;
    last_name?: string;
  };
}