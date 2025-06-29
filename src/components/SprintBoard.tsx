import React from 'react';
import { SprintCard } from './SprintCard';

// Mock data for Sprint 1
const mockStories = {
  priority: [
    { id: '1', number: 'STORY-001', title: 'User Authentication System', completed: false, date: '28/06/2025' },
    { id: '2', number: 'STORY-002', title: 'Password Reset Flow', completed: true, date: '27/06/2025' },
    { id: '3', number: 'STORY-003', title: 'Dashboard Layout Design', completed: false, date: '28/06/2025' },
    { id: '4', number: 'STORY-004', title: 'API Integration Setup', completed: false, date: '28/06/2025' },
    { id: '5', number: 'STORY-005', title: 'Mobile Responsive Updates', completed: false, date: '28/06/2025' }
  ],
  development: [
    { id: '6', number: 'STORY-006', title: 'Database Schema Migration', completed: false, date: '28/06/2025' },
    { id: '7', number: 'STORY-007', title: 'Search Functionality', completed: false, date: '28/06/2025' },
    { id: '8', number: 'STORY-008', title: 'Unit Test Coverage', completed: true, date: '26/06/2025' },
    { id: '9', number: 'STORY-009', title: 'Performance Optimization', completed: false, date: '28/06/2025' },
    { id: '10', number: 'STORY-010', title: 'Error Handling Framework', completed: false, date: '28/06/2025' }
  ],
  backlog: [
    { id: '11', number: 'STORY-011', title: 'Social Media Integration', completed: false, date: 'Future' },
    { id: '12', number: 'STORY-012', title: 'Advanced Analytics Dashboard', completed: false, date: 'Future' },
    { id: '13', number: 'STORY-013', title: 'Multi-language Support', completed: false, date: 'Future' },
    { id: '14', number: 'STORY-014', title: 'Dark Mode Theme', completed: false, date: 'Future' },
    { id: '15', number: 'STORY-015', title: 'Email Notification System', completed: false, date: 'Future' },
    { id: '16', number: 'STORY-016', title: 'Advanced Search Filters', completed: false, date: 'Future' },
    { id: '17', number: 'STORY-017', title: 'File Upload Enhancement', completed: false, date: 'Future' },
    { id: '18', number: 'STORY-018', title: 'Real-time Collaboration', completed: false, date: 'Future' },
    { id: '19', number: 'STORY-019', title: 'API Rate Limiting', completed: false, date: 'Future' },
    { id: '20', number: 'STORY-020', title: 'Advanced Security Features', completed: false, date: 'Future' }
  ]
};

interface SprintBoardProps {
  onAddStory: (sprintId: string) => void;
  onOpenSprint: (sprintId: string) => void;
  onCloseSprint: (sprintId: string, type: 'completed' | 'all') => void;
  onToggleStory: (storyId: string) => void;
}

export const SprintBoard: React.FC<SprintBoardProps> = ({
  onAddStory,
  onOpenSprint,
  onCloseSprint,
  onToggleStory
}) => {
  const calculateStats = (stories: typeof mockStories.priority) => {
    const completed = stories.filter(s => s.completed).length;
    const total = stories.length;
    return {
      todo: total - completed,
      inProgress: 0, // Will be dynamic in later sprints
      done: completed
    };
  };

  return (
    <main className="p-6 max-w-none mx-auto">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Sprint Board</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Priority Sprint */}
        <SprintCard
          id="priority"
          title="Priority Sprint"
          icon="🔥"
          stories={mockStories.priority}
          stats={calculateStats(mockStories.priority)}
          onAddStory={() => onAddStory('priority')}
          onOpenSprint={() => onOpenSprint('priority')}
          onCloseSprint={(type) => onCloseSprint('priority', type)}
          onToggleStory={onToggleStory}
        />

        {/* Development Sprint */}
        <SprintCard
          id="development"
          title="Development Sprint"
          icon="⚡"
          stories={mockStories.development}
          stats={calculateStats(mockStories.development)}
          isDraggable={true}
          onAddStory={() => onAddStory('development')}
          onOpenSprint={() => onOpenSprint('development')}
          onCloseSprint={(type) => onCloseSprint('development', type)}
          onToggleStory={onToggleStory}
        />
      </div>

      {/* Backlog Sprint - Full Width */}
      <SprintCard
        id="backlog"
        title="Backlog - Future Enhancements"
        icon="📋"
        stories={mockStories.backlog}
        stats={calculateStats(mockStories.backlog)}
        isBacklog={true}
        onAddStory={() => onAddStory('backlog')}
        onOpenSprint={() => onOpenSprint('backlog')}
        onCloseSprint={(type) => onCloseSprint('backlog', type)}
        onToggleStory={onToggleStory}
      />
    </main>
  );
};