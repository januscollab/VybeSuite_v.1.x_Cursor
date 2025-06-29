import React, { useState } from 'react';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  activeView: 'active' | 'archive';
  onViewChange: (view: 'active' | 'archive') => void;
  onAddSprint: () => void;
  onOpenSettings: () => void;
  onOpenProfileSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onViewChange,
  onAddSprint,
  onOpenSettings,
  onOpenProfileSettings
}) => {
  return (
    <header className="bg-bg-primary border-b border-border-default sticky top-0 z-50 shadow-devsuite">
      <div className="max-w-none mx-auto px-5 py-4">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-devsuite-primary rounded-lg flex items-center justify-center text-text-inverse font-bold text-base">
              SM
            </div>
            <span className="text-xl font-bold text-text-primary">Scrum Master</span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            {/* Toggle Switch */}
            <div className="flex items-center gap-3 bg-bg-muted rounded-lg p-1">
              <button
                onClick={() => onViewChange('active')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeView === 'active'
                    ? 'text-devsuite-primary'
                    : 'text-text-secondary hover:bg-devsuite-primary/10 hover:text-devsuite-primary'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => onViewChange('archive')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeView === 'archive'
                    ? 'text-devsuite-primary'
                    : 'text-text-secondary hover:bg-devsuite-primary/10 hover:text-devsuite-primary'
                }`}
              >
                Archive
              </button>
            </div>

            {/* User Menu */}
            <UserMenu 
              onAddSprint={onAddSprint}
              onOpenSettings={onOpenSettings}
              onOpenProfileSettings={onOpenProfileSettings}
            />
          </nav>
        </div>
      </div>
    </header>
  );
};