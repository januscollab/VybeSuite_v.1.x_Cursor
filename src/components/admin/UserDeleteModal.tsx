import React, { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { debug } from '../../utils/debug';

interface UserDeleteModalProps {
  isOpen: boolean;
  user: any;
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
      
      // Simple approach - just delete user data without complex chaining
      await supabase.from('sprints').delete().eq('user_id', user.id);
      await supabase.from('stories').delete().eq('user_id', user.id);  
      await supabase.from('user_settings').delete().eq('user_id', user.id);
      await supabase.from('user_roles').delete().eq('user_id', user.id);

      debug.info('UserDeleteModal', `Successfully deleted all data for user: ${user.email}`);
      onDeleted();
      onClose();
      
    } catch (error) {
      debug.error('UserDeleteModal', `Deletion failed`, { error });
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
