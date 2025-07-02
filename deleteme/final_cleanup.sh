#!/bin/bash
echo "=== FINAL CLEANUP OF REMAINING ERRORS ==="

# 1. Fix the isOpen prop issue in UserManagement
echo "Fixing UserDeleteModal isOpen prop..."
sed -i.bak 's/user={selectedUser}/user={selectedUser} isOpen={showDeleteModal}/' src/components/admin/UserManagement.tsx

# 2. Fix remaining debug calls in aiService
echo "Fixing remaining aiService debug calls..."
sed -i.bak 's/debug\.warn(`${provider} connection test failed due to CORS restrictions`, { error: error\.message });/debug.warn(provider, `CORS error in connection test`, { error });/' src/utils/aiService.ts
sed -i.bak 's/debug\.error(`${provider} connection test failed`, { error });/debug.error(provider, `Connection test failed`, { error });/' src/utils/aiService.ts

# 3. Remove the unused ImportMetaEnv
echo "Removing unused ImportMetaEnv interface..."
sed -i.bak '/interface ImportMetaEnv/,/^}/d' src/utils/debug.ts

# 4. Delete the problematic transform-logs.ts file completely
echo "Removing transform-logs.ts completely..."
rm -f transform-logs.ts

# 5. Fix Supabase query chain issues in UserDeleteModal by using proper await
echo "Fixing UserDeleteModal Supabase queries..."
cat > src/components/admin/UserDeleteModal.tsx << 'MODALEOF'
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { debug } from '../../utils/debug';

interface UserDeleteModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onDeleted: () => void;
}

export const UserDeleteModal: React.FC<UserDeleteModalProps> = ({ 
  isOpen, 
  user, 
  onClose, 
  onDeleted 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !user) return null;

  const handleDelete = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    
    try {
      debug.info('UserDeleteModal', `Starting deletion process for user: ${user.email}`);
      
      // Delete user data in correct order to avoid foreign key constraints
      const { error: sprintsError } = await supabase
        .from('sprints')
        .delete()
        .eq('user_id', user.id);
      
      if (sprintsError) {
        debug.error('UserDeleteModal', `Failed to delete sprints: ${sprintsError.message}`, { error: sprintsError });
        throw sprintsError;
      }

      const { error: storiesError } = await supabase
        .from('stories')
        .delete()
        .eq('user_id', user.id);
      
      if (storiesError) {
        debug.error('UserDeleteModal', `Failed to delete stories: ${storiesError.message}`, { error: storiesError });
        throw storiesError;
      }

      const { error: settingsError } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', user.id);
      
      if (settingsError) {
        debug.error('UserDeleteModal', `Failed to delete settings: ${settingsError.message}`, { error: settingsError });
        throw settingsError;
      }

      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);
      
      if (rolesError) {
        debug.error('UserDeleteModal', `Failed to delete roles: ${rolesError.message}`, { error: rolesError });
        throw rolesError;
      }

      debug.info('UserDeleteModal', `Successfully deleted all data for user: ${user.email}`);
      onDeleted();
      onClose();
      
    } catch (error) {
      debug.error('UserDeleteModal', `Deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { error });
      alert('Failed to delete user. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border-default rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Delete User</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-tertiary rounded transition-colors"
          >
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-text-secondary mb-2">
            Are you sure you want to delete this user? This action cannot be undone.
          </p>
          <div className="p-3 bg-bg-tertiary rounded border">
            <p className="font-medium text-text-primary">{user.email}</p>
            {user.user_metadata?.first_name && (
              <p className="text-text-secondary text-sm">
                {user.user_metadata.first_name} {user.user_metadata.last_name}
              </p>
            )}
          </div>
          <p className="text-text-tertiary text-sm mt-2">
            This will permanently delete all user data including sprints, stories, and settings.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-border-default rounded-lg hover:bg-bg-tertiary transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error-dark transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  );
};
MODALEOF

echo "✅ Final cleanup completed!"
