import { debug } from '../utils/debug';
import React from 'react';
import { Plus, Play, FileText, GripVertical } from 'lucide-react';
import { Story } from '../types';
interface SprintCardProps {
    id: string;
    title: string;
    icon: string;
    stories: Story[];
    stats: {
        todo: number;
        inProgress: number;
        done: number;
    };
    isBacklog?: boolean;
    isDraggable?: boolean;
    onAddStory: () => void;
    onOpenSprint: () => void;
    onCloseSprint: (type: 'completed' | 'all') => void;
    onToggleStory: (storyId: string) => void;
}
export const SprintCard: React.FC<SprintCardProps> = ({ title, icon, stories, stats, isBacklog = false, isDraggable = false, onAddStory, onOpenSprint, onCloseSprint, onToggleStory }) => {
    const renderStories = (storiesToRender: Story[]) => (<div className={isBacklog ? 'grid grid-cols-1 lg:grid-cols-2 gap-2' : 'space-y-2'}>
      {storiesToRender.map((story) => (<div key={story.id} className="bg-bg-secondary border border-border-subtle rounded-lg p-3 flex items-center gap-3 transition-all hover:bg-bg-muted hover:border-border-default hover:shadow-sm">
          <span className="text-text-quaternary cursor-grab font-bold text-xs">::</span>
          
          <button onClick={() => onToggleStory(story.id)} className={`w-4 h-4 border-2 rounded flex-shrink-0 flex items-center justify-center transition-all ${story.completed
                ? 'bg-devsuite-secondary border-devsuite-secondary text-text-inverse'
                : 'border-border-strong bg-bg-primary hover:border-devsuite-primary'}`}>
            {story.completed && <span className="text-xs font-bold">✓</span>}
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="font-medium text-text-primary text-sm flex-shrink-0">
              {story.number}
            </span>
            <span className={`text-sm flex-1 truncate ${story.completed ? 'line-through text-text-quaternary' : 'text-text-secondary'}`}>
              {story.title}
            </span>
          </div>

          <span className="text-xs text-text-quaternary flex-shrink-0">
            {story.date}
          </span>
        </div>))}
    </div>);
    return (<div className={`sprint-card bg-bg-primary border border-border-default rounded-xl p-6 shadow-devsuite transition-all hover:shadow-devsuite-hover hover:border-border-strong relative ${isBacklog ? 'col-span-full' : ''}`}>
      {/* Glassmorphism Context Menu */}
      <div className="glassmorphism-context-menu">
        <button className="btn-glass btn-glass-primary" onClick={onAddStory} title="Add new story to this sprint">
          <Plus className="w-3.5 h-3.5"/>
          Add Story
        </button>
        
        <button className="btn-glass btn-glass-secondary" onClick={onOpenSprint} title="Open sprint">
          <Play className="w-3.5 h-3.5"/>
          Open Sprint
        </button>
        
        <button className="btn-glass btn-glass-neutral" onClick={() => onCloseSprint('completed')} disabled={stats.done === 0} title={stats.done === 0 ? "No completed stories to close" : "Close completed stories"}>
          <FileText className="w-3.5 h-3.5"/>
          Close Stories
        </button>
      </div>

      {/* Sprint Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isDraggable && (<GripVertical className="w-3 h-3 text-text-quaternary cursor-grab hover:text-devsuite-primary transition-colors"/>)}
            <span className="text-base">{icon}</span>
            <h3 className="font-semibold text-lg text-text-primary">{title}</h3>
          </div>
          
          <div className="flex gap-4 text-sm text-text-tertiary">
            <div className="flex items-center gap-1">
              <span>○</span>
              <span>{stats.todo} To Do</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⚡</span>
              <span>{stats.inProgress} In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <span>✓</span>
              <span>{stats.done} Done</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stories */}
      {renderStories(stories)}
    </div>);
};
