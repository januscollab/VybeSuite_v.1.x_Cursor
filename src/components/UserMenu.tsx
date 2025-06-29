import React, { useState } from 'react';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary hover:bg-devsuite-primary/10 hover:text-devsuite-primary rounded-md transition-all"
      >
        <div className="w-6 h-6 bg-devsuite-primary rounded-full flex items-center justify-center text-text-inverse text-xs font-bold">
          {user.email?.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:inline">{user.email}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full right-0 mt-1 bg-bg-primary border border-border-default rounded-lg shadow-devsuite-hover z-50 min-w-48 overflow-hidden">
            <div className="px-3 py-2 border-b border-border-subtle">
              <p className="text-sm font-medium text-text-primary truncate">{user.email}</p>
              <p className="text-xs text-text-tertiary">Signed in</p>
            </div>
            
            <button
              onClick={() => {
                console.log('Profile settings clicked');
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-muted hover:text-text-primary transition-colors border-b border-border-subtle"
            >
              <User className="w-4 h-4" />
              Profile Settings
            </button>
            
            <button
              onClick={() => {
                console.log('Account settings clicked');
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-text-secondary hover:bg-bg-muted hover:text-text-primary transition-colors border-b border-border-subtle"
            >
              <Settings className="w-4 h-4" />
              Account Settings
            </button>
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-error hover:bg-error-light hover:text-error-dark transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
};