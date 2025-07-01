import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { useAdminAuth } from '../hooks/useAdminAuth';

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
  const { isAdmin } = useAdminAuth();

  return (
    <header className="bg-bg-primary border-b border-border-default sticky top-0 z-50 shadow-devsuite">
      <div className="max-w-none mx-auto px-5 py-4">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-devsuite-primary rounded-lg flex items-center justify-center text-text-inverse font-bold text-base">
              SM
            </div>
            <span className="text-xl font-bold text-text-primary">Sprint Boards</span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            {/* Admin Menu - Only visible to super admins */}
            {isAdmin && (
              <button
                onClick={() => window.open('/admin', '_blank')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-text-secondary hover:bg-devsuite-primary/10 hover:text-devsuite-primary transition-all"
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            )}

            {/* Toggle Switch */}
            <div className="main-toggle">
              <button
                onClick={() => onViewChange('active')}
                className={`toggle-option ${activeView === 'active' ? 'active' : ''}`}
              >
                Active
              </button>
              <button
                onClick={() => onViewChange('archive')}
                className={`toggle-option ${activeView === 'archive' ? 'active' : ''}`}
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