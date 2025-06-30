import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Database, FileText, Settings, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PulsingDotsLoader } from '../LoadingSpinner';

interface User {
  id: string;
  email: string;
  role: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
  };
}

interface UserDeleteModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onDeleted: () => void;
}

export const UserDeleteModal: React.FC<UserDeleteModalProps> = ({
  isOpen,
  user,
  onClose,
  onDeleted
}) => {
  const [step, setStep] = useState<'confirm' | 'progress' | 'complete'>('confirm');
  const [confirmText, setConfirmText] = useState('');
  const [deletionProgress, setDeletionProgress] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getDisplayName = () => {
    const firstName = user.user_metadata.first_name || '';
    const lastName = user.user_metadata.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || user.email;
  };

  const isConfirmValid = confirmText === 'DELETE' || confirmText === user.email;

  const addProgress = (message: string) => {
    setDeletionProgress(prev => [...prev, message]);
  };

  const handleDelete = async () => {
    if (!isConfirmValid) return;

    setStep('progress');
    setError(null);
    setDeletionProgress([]);

    try {
      // Step 1: Delete user stories
      addProgress('Deleting user stories...');
      const { error: storiesError } = await supabase
        .from('stories')
        .delete()
        .in('sprint_id', 
          supabase
            .from('sprints')
            .select('id')
            .eq('user_id', user.id)
        );

      if (storiesError) throw new Error(`Failed to delete stories: ${storiesError.message}`);
      addProgress('✅ User stories deleted');

      // Step 2: Delete user sprints
      addProgress('Deleting user sprints...');
      const { error: sprintsError } = await supabase
        .from('sprints')
        .delete()
        .eq('user_id', user.id);

      if (sprintsError) throw new Error(`Failed to delete sprints: ${sprintsError.message}`);
      addProgress('✅ User sprints deleted');

      // Step 3: Delete user settings
      addProgress('Deleting user settings...');
      const { error: settingsError } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id);

      if (settingsError) throw new Error(`Failed to delete user settings: ${settingsError.message}`);
      addProgress('✅ User settings deleted');

      // Step 4: Delete user role
      addProgress('Removing user role...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);

      if (roleError) throw new Error(`Failed to delete user role: ${roleError.message}`);
      addProgress('✅ User role removed');

      // Step 5: Delete user from auth
      addProgress('Deleting user account...');
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

      if (authError) throw new Error(`Failed to delete user account: ${authError.message}`);
      addProgress('✅ User account deleted');

      addProgress('🎉 User deletion completed successfully');
      setStep('complete');

      // Auto-close after 2 seconds
      setTimeout(() => {
        onDeleted();
      }, 2000);

    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      addProgress(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center p-5">
      <div className="bg-bg-primary rounded-xl shadow-devsuite-modal border border-border-default w-full max-w-2xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-error-light rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Delete User Account</h1>
              <p className="text-sm text-text-tertiary">
                {step === 'confirm' && 'This action cannot be undone'}
                {step === 'progress' && 'Deleting user data...'}
                {step === 'complete' && 'Deletion completed'}
              </p>
            </div>
          </div>
          {step === 'confirm' && (
            <button
              onClick={onClose}
              className="absolute top-3 right-5 w-8 h-8 border-none bg-transparent cursor-pointer rounded-md flex items-center justify-center text-text-quaternary hover:bg-bg-canvas hover:text-text-secondary transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {step === 'confirm' && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-bg-muted rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-devsuite-primary rounded-full flex items-center justify-center text-text-inverse font-bold">
                    {getDisplayName().charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary">{getDisplayName()}</div>
                    <div className="text-sm text-text-tertiary">{user.email}</div>
                    <div className="text-xs text-text-quaternary">Role: {user.role}</div>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-error-light border border-error rounded-lg p-4">
                <h3 className="font-semibold text-error-dark mb-2">⚠️ Complete Data Purge</h3>
                <p className="text-error-dark text-sm mb-3">
                  This will permanently delete <strong>{getDisplayName()}</strong> and ALL associated data:
                </p>
                <div className="space-y-2 text-sm text-error-dark">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>All user stories and content</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <span>All user sprints and projects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>User settings and preferences</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>User account and authentication</span>
                  </div>
                </div>
              </div>

              {/* Confirmation Input */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Type <code className="bg-bg-muted px-1 py-0.5 rounded text-error font-mono">DELETE</code> or the user's email to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE or user email"
                  className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-error focus:ring-2 focus:ring-error/20 transition-all"
                />
              </div>

              {error && (
                <div className="bg-error-light border border-error rounded-lg p-3">
                  <p className="text-error-dark text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {(step === 'progress' || step === 'complete') && (
            <div className="space-y-4">
              <div className="bg-bg-muted rounded-lg p-4">
                <h3 className="font-semibold text-text-primary mb-3">Deletion Progress</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {deletionProgress.map((message, index) => (
                    <div key={index} className="text-sm font-mono text-text-secondary">
                      {message}
                    </div>
                  ))}
                </div>
                {step === 'progress' && (
                  <div className="flex items-center gap-2 mt-3">
                    <PulsingDotsLoader size="sm" />
                    <span className="text-sm text-text-secondary">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'confirm' && (
          <div className="px-6 py-4 border-t border-border-default flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded-lg hover:bg-bg-muted transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!isConfirmValid}
              className="flex items-center gap-2 px-4 py-2 bg-error text-text-inverse text-sm font-medium rounded-lg hover:bg-error-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Delete User Permanently
            </button>
          </div>
        )}

        {step === 'complete' && (
          <div className="px-6 py-4 border-t border-border-default flex justify-center">
            <div className="text-sm text-success">
              User deleted successfully. Closing...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};