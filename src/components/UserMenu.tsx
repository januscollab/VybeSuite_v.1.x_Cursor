import React, { useState } from 'react';
import { User, LogOut, Settings, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserMenuProps {
  onAddSprint: () => void;
  onOpenSettings: () => void;
  onOpenProfileSettings: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onAddSprint, onOpenSettings, onOpenProfileSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const handleAddSprint = () => {
    onAddSprint();
    setIsOpen(false);
  };

  const handleOpenSettings = () => {
    onOpenSettings();
    setIsOpen(false);
  };

  const handleOpenProfileSettings = () => {
    onOpenProfileSettings();
    setIsOpen(false);
  };

  if (!user) return null;

  // Get user's display name or email
  const displayName = user.user_metadata?.full_name || user.email || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary hover:bg-devsuite-primary/10 hover:text-devsuite-primary rounded-md transition-all"
      >
        <div className="w-7 h-7 bg-devsuite-primary rounded-full flex items-center justify-center text-text-inverse text-xs font-bold">
          {initials}
        </div>
        <span className="hidden sm:inline max-w-32 truncate">{displayName}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-1 bg-bg-primary border border-border-default rounded-lg shadow-devsuite-hover z-50 min-w-56 overflow-hidden"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-border-subtle bg-bg-muted">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-devsuite-primary rounded-full flex items-center justify-center text-text-inverse text-sm font-bold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{displayName}</p>
                <p className="text-xs text-text-tertiary truncate">{user.email}</p>
              </div>
            </div>
          </div>
          
          {/* Account Settings Section */}
          <div className="py-1">
            <button
              onClick={handleOpenProfileSettings}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-muted hover:text-text-primary transition-colors"
            >
              <User className="w-4 h-4" />
              Profile Settings
            </button>
            
            <button
              onClick={handleOpenSettings}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-muted hover:text-text-primary transition-colors"
            >
              <Settings className="w-4 h-4" />
              AI Settings
            </button>

            <button
              onClick={handleAddSprint}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-muted hover:text-text-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Sprint
            </button>
          </div>
          
          {/* Sign Out */}
          <div className="py-1">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-error hover:bg-error-light hover:text-error-dark transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};