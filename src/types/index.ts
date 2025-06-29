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