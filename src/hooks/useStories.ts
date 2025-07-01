import { useState, useCallback } from 'react';
import { Story, Sprint } from '../types';

// Initial mock data with proper typing
const initialSprints: Sprint[] = [
  {
    id: 'priority',
    title: 'Priority Sprint',
    icon: '🔥',
    stories: [
      { 
        id: '1', 
        number: 'STORY-001', 
        title: 'User Authentication System', 
        completed: false, 
        date: '28/06/2025',
        tags: ['authentication', 'security'],
        sprintId: 'priority',
        createdAt: '2025-06-26T10:00:00Z',
        updatedAt: '2025-06-26T10:00:00Z'
      },
      { 
        id: '2', 
        number: 'STORY-002', 
        title: 'Password Reset Flow', 
        completed: true, 
        date: '27/06/2025',
        tags: ['authentication', 'ux'],
        sprintId: 'priority',
        createdAt: '2025-06-25T10:00:00Z',
        updatedAt: '2025-06-27T15:30:00Z'
      },
      { 
        id: '3', 
        number: 'STORY-003', 
        title: 'Dashboard Layout Design', 
        completed: false, 
        date: '28/06/2025',
        tags: ['ui', 'design'],
        sprintId: 'priority',
        createdAt: '2025-06-26T11:00:00Z',
        updatedAt: '2025-06-26T11:00:00Z'
      },
      { 
        id: '4', 
        number: 'STORY-004', 
        title: 'API Integration Setup', 
        completed: false, 
        date: '28/06/2025',
        tags: ['api', 'backend'],
        sprintId: 'priority',
        createdAt: '2025-06-26T12:00:00Z',
        updatedAt: '2025-06-26T12:00:00Z'
      },
      { 
        id: '5', 
        number: 'STORY-005', 
        title: 'Mobile Responsive Updates', 
        completed: false, 
        date: '28/06/2025',
        tags: ['responsive', 'mobile'],
        sprintId: 'priority',
        createdAt: '2025-06-26T13:00:00Z',
        updatedAt: '2025-06-26T13:00:00Z'
      }
    ]
  },
  {
    id: 'development',
    title: 'Development Sprint',
    icon: '⚡',
    isDraggable: true,
    stories: [
      { 
        id: '6', 
        number: 'STORY-006', 
        title: 'Database Schema Migration', 
        completed: false, 
        date: '28/06/2025',
        tags: ['database', 'migration'],
        sprintId: 'development',
        createdAt: '2025-06-26T14:00:00Z',
        updatedAt: '2025-06-26T14:00:00Z'
      },
      { 
        id: '7', 
        number: 'STORY-007', 
        title: 'Search Functionality', 
        completed: false, 
        date: '28/06/2025',
        tags: ['search', 'feature'],
        sprintId: 'development',
        createdAt: '2025-06-26T15:00:00Z',
        updatedAt: '2025-06-26T15:00:00Z'
      },
      { 
        id: '8', 
        number: 'STORY-008', 
        title: 'Unit Test Coverage', 
        completed: true, 
        date: '26/06/2025',
        tags: ['testing', 'quality'],
        sprintId: 'development',
        createdAt: '2025-06-24T10:00:00Z',
        updatedAt: '2025-06-26T16:00:00Z'
      },
      { 
        id: '9', 
        number: 'STORY-009', 
        title: 'Performance Optimization', 
        completed: false, 
        date: '28/06/2025',
        tags: ['performance', 'optimization'],
        sprintId: 'development',
        createdAt: '2025-06-26T17:00:00Z',
        updatedAt: '2025-06-26T17:00:00Z'
      },
      { 
        id: '10', 
        number: 'STORY-010', 
        title: 'Error Handling Framework', 
        completed: false, 
        date: '28/06/2025',
        tags: ['error-handling', 'framework'],
        sprintId: 'development',
        createdAt: '2025-06-26T18:00:00Z',
        updatedAt: '2025-06-26T18:00:00Z'
      }
    ]
  },
  {
    id: 'backlog',
            title: 'Backlog',
    icon: '📋',
    isBacklog: true,
    stories: [
      { 
        id: '11', 
        number: 'STORY-011', 
        title: 'Social Media Integration', 
        completed: false, 
        date: 'Future',
        tags: ['social', 'integration'],
        sprintId: 'backlog',
        createdAt: '2025-06-26T19:00:00Z',
        updatedAt: '2025-06-26T19:00:00Z'
      },
      { 
        id: '12', 
        number: 'STORY-012', 
        title: 'Advanced Analytics Dashboard', 
        completed: false, 
        date: 'Future',
        tags: ['analytics', 'dashboard'],
        sprintId: 'backlog',
        createdAt: '2025-06-26T20:00:00Z',
        updatedAt: '2025-06-26T20:00:00Z'
      },
      { 
        id: '13', 
        number: 'STORY-013', 
        title: 'Multi-language Support', 
        completed: false, 
        date: 'Future',
        tags: ['i18n', 'localization'],
        sprintId: 'backlog',
        createdAt: '2025-06-26T21:00:00Z',
        updatedAt: '2025-06-26T21:00:00Z'
      },
      { 
        id: '14', 
        number: 'STORY-014', 
        title: 'Dark Mode Theme', 
        completed: false, 
        date: 'Future',
        tags: ['theme', 'ui'],
        sprintId: 'backlog',
        createdAt: '2025-06-26T22:00:00Z',
        updatedAt: '2025-06-26T22:00:00Z'
      },
      { 
        id: '15', 
        number: 'STORY-015', 
        title: 'Email Notification System', 
        completed: false, 
        date: 'Future',
        tags: ['email', 'notifications'],
        sprintId: 'backlog',
        createdAt: '2025-06-26T23:00:00Z',
        updatedAt: '2025-06-26T23:00:00Z'
      },
      { 
        id: '16', 
        number: 'STORY-016', 
        title: 'Advanced Search Filters', 
        completed: false, 
        date: 'Future',
        tags: ['search', 'filters'],
        sprintId: 'backlog',
        createdAt: '2025-06-27T00:00:00Z',
        updatedAt: '2025-06-27T00:00:00Z'
      },
      { 
        id: '17', 
        number: 'STORY-017', 
        title: 'File Upload Enhancement', 
        completed: false, 
        date: 'Future',
        tags: ['upload', 'files'],
        sprintId: 'backlog',
        createdAt: '2025-06-27T01:00:00Z',
        updatedAt: '2025-06-27T01:00:00Z'
      },
      { 
        id: '18', 
        number: 'STORY-018', 
        title: 'Real-time Collaboration', 
        completed: false, 
        date: 'Future',
        tags: ['realtime', 'collaboration'],
        sprintId: 'backlog',
        createdAt: '2025-06-27T02:00:00Z',
        updatedAt: '2025-06-27T02:00:00Z'
      },
      { 
        id: '19', 
        number: 'STORY-019', 
        title: 'API Rate Limiting', 
        completed: false, 
        date: 'Future',
        tags: ['api', 'rate-limiting'],
        sprintId: 'backlog',
        createdAt: '2025-06-27T03:00:00Z',
        updatedAt: '2025-06-27T03:00:00Z'
      },
      { 
        id: '20', 
        number: 'STORY-020', 
        title: 'Advanced Security Features', 
        completed: false, 
        date: 'Future',
        tags: ['security', 'advanced'],
        sprintId: 'backlog',
        createdAt: '2025-06-27T04:00:00Z',
        updatedAt: '2025-06-27T04:00:00Z'
      }
    ]
  }
];

export const useStories = () => {
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);

  const generateStoryNumber = useCallback(() => {
    const allStories = sprints.flatMap(sprint => sprint.stories);
    const maxNumber = allStories.reduce((max, story) => {
      const num = parseInt(story.number.split('-')[1]);
      return num > max ? num : max;
    }, 0);
    return `STORY-${String(maxNumber + 1).padStart(3, '0')}`;
  }, [sprints]);

  const addStory = useCallback((sprintId: string, title: string, description: string, tags: string[]) => {
    const newStory: Story = {
      id: Date.now().toString(),
      number: generateStoryNumber(),
      title,
      description,
      completed: false,
      date: new Date().toLocaleDateString('en-GB'),
      tags,
      sprintId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSprints(prevSprints => 
      prevSprints.map(sprint => 
        sprint.id === sprintId 
          ? { ...sprint, stories: [...sprint.stories, newStory] }
          : sprint
      )
    );

    return newStory;
  }, [generateStoryNumber]);

  const toggleStory = useCallback((storyId: string) => {
    setSprints(prevSprints => 
      prevSprints.map(sprint => ({
        ...sprint,
        stories: sprint.stories.map(story => 
          story.id === storyId 
            ? { 
                ...story, 
                completed: !story.completed,
                updatedAt: new Date().toISOString()
              }
            : story
        )
      }))
    );
  }, []);

  const getSprintStats = useCallback((sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return { todo: 0, inProgress: 0, done: 0 };

    const completed = sprint.stories.filter(s => s.completed).length;
    const total = sprint.stories.length;
    
    return {
      todo: total - completed,
      inProgress: 0, // Will be dynamic in later sprints
      done: completed
    };
  }, [sprints]);

  return {
    sprints,
    addStory,
    toggleStory,
    getSprintStats
  };
};