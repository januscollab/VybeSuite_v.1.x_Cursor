import React, { useState } from 'react';
import { Settings, Plus } from 'lucide-react';

interface HeaderProps {
  activeView: 'active' | 'archive';
  onViewChange: (view: 'active' | 'archive') => void;
  onAddSprint: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onViewChange,
  onAddSprint,
  onOpenSettings
}) => {
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

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
          <nav className="flex items-center gap-2">
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

            {/* Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-text-secondary hover:bg-devsuite-primary/10 hover:text-devsuite-primary rounded-md transition-all"
              >
                <Settings className="w-4 h-4" />
                Settings
                <span className="text-xs ml-1">▼</span>
              </button>

              {showSettingsDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-bg-primary border border-border-default rounded-lg shadow-devsuite-hover z-50 min-w-40 overflow-hidden">
                  <button
                    onClick={() => {
                      onAddSprint();
                      setShowSettingsDropdown(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-muted hover:text-text-primary transition-colors border-b border-border-subtle"
                  >
                    <Plus className="w-4 h-4" />
                    Add Sprint
                  </button>
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setShowSettingsDropdown(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-muted hover:text-text-primary transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Sprint Settings
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};