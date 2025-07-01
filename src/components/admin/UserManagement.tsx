// UserManagement Component with Service Role Key Support
// Replace src/components/admin/UserManagement.tsx with this code

import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Trash2, Edit, UserX, UserCheck, Mail } from 'lucide-react';
import { supabase, getAdminClient, isAdminEnabled } from '../../lib/supabase';
import { PulsingDotsLoader } from '../LoadingSpinner';
import { UserDeleteModal } from './UserDeleteModal';
import { UserFormModal } from './UserFormModal';

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  user_metadata: {
    first_name?: string;
    last_name?: string;
  };
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [adminWarning, setAdminWarning] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setAdminWarning(null);

      if (!isAdminEnabled()) {
        setAdminWarning('Admin operations require service role key configuration');
        // Fallback to current user only
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setUsers([{
            id: currentUser.id,
            email: currentUser.email || '',
            role: 'super_admin',
            created_at: currentUser.created_at,
            last_sign_in_at: currentUser.last_sign_in_at,
            email_confirmed_at: currentUser.email_confirmed_at,
            user_metadata: currentUser.user_metadata || {}
          }]);
        }
        return;
      }

      // Use admin client to get all users
      const adminClient = getAdminClient();
      const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching users with admin API:', authError);
        throw authError;
      }

      // Get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        // Continue without roles if needed
      }

      // Combine user data with roles
      const usersWithRoles = authUsers.users.map(user => ({
        id: user.id,
        email: user.email || '',
        role: userRoles?.find(r => r.user_id === user.id)?.role || 'user',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        user_metadata: user.user_metadata || {}
      }));

      setUsers(usersWithRoles);
      console.log(`✅ Loaded ${usersWithRoles.length} users successfully`);

    } catch (err) {
      console.error('Error loading users:', err);
      setAdminWarning('Failed to load users. Check console for details.');
      
      // Fallback: Show current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUsers([{
          id: currentUser.id,
          email: currentUser.email || '',
          role: 'super_admin',
          created_at: currentUser.created_at,
          last_sign_in_at: currentUser.last_sign_in_at,
          email_confirmed_at: currentUser.email_confirmed_at,
          user_metadata: currentUser.user_metadata || {}
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${user.user_metadata.first_name || ''} ${user.user_metadata.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleCreateUser = () => {
    if (!isAdminEnabled()) {
      alert('User creation requires service role key configuration');
      return;
    }
    setEditingUser(null);
    setShowUserModal(true);
  };

  const handleUserDeleted = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
    loadUsers();
  };

  const handleUserSaved = () => {
    setShowUserModal(false);
    setEditingUser(null);
    loadUsers();
  };

  const handleResetPassword = async (user: User) => {
    const actionId = `reset-${user.id}`;
    setActionLoading(prev => ({ ...prev, [actionId]: true }));

    try {
      if (isAdminEnabled()) {
        // Use admin API for password reset
        const adminClient = getAdminClient();
        const { error } = await adminClient.auth.admin.generateLink({
          type: 'recovery',
          email: user.email
        });

        if (error) throw error;
      } else {
        // Fallback to regular password reset
        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
          redirectTo: `${window.location.origin}/auth/reset-password`
        });

        if (error) throw error;
      }

      alert(`Password reset email sent to ${user.email}`);
    } catch (err) {
      console.error('Error sending password reset:', err);
      alert('Failed to send password reset email');
    } finally {
      setActionLoading(prev => ({ ...prev, [actionId]: false }));
    }
  };

  const getDisplayName = (user: User) => {
    const firstName = user.user_metadata.first_name || '';
    const lastName = user.user_metadata.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || user.email.split('@')[0];
  };

  const getInitials = (user: User) => {
    const firstName = user.user_metadata.first_name || '';
    const lastName = user.user_metadata.last_name || '';
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return user.email.charAt(0).toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-devsuite-primary text-text-inverse';
      case 'admin':
        return 'bg-devsuite-secondary text-text-inverse';
      default:
        return 'bg-bg-muted text-text-secondary';
    }
  };

  if (loading) {
    return (
      <div className="bg-bg-primary rounded-xl p-8">
        <div className="flex items-center justify-center py-12">
          <PulsingDotsLoader size="lg" className="mr-3" />
          <span className="text-text-secondary">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Warning */}
      {adminWarning && (
        <div className="bg-warning-light border border-warning-dark rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-warning-dark rounded-full"></div>
            <span className="text-warning-dark font-medium">Admin Notice</span>
          </div>
          <p className="text-warning-dark mt-1">{adminWarning}</p>
          <p className="text-sm text-warning-dark mt-2">
            To enable full admin functionality, add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">User Management</h2>
          <p className="text-text-tertiary">Manage platform users and permissions</p>
        </div>
      </div>

      {/* Search Bar - Moved up and made more prominent */}
      <div className="bg-bg-primary rounded-xl p-6 border border-border-default">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-quaternary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-11 pr-4 py-3 border border-border-default rounded-lg bg-bg-secondary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all text-sm"
            />
          </div>
          <button
            onClick={handleCreateUser}
            className="flex items-center gap-2 px-6 py-3 bg-devsuite-primary text-text-inverse rounded-lg hover:bg-devsuite-primary-hover transition-colors disabled:opacity-50 font-medium"
            disabled={!isAdminEnabled()}
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
        {searchQuery && (
          <div className="mt-3 text-sm text-text-secondary">
            {filteredUsers.length === 1 ? '1 user' : `${filteredUsers.length} users`} found for "{searchQuery}"
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-bg-primary rounded-xl border border-border-default overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-muted border-b border-border-default">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-text-primary">User</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-text-primary">Role</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-text-primary">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-text-primary">Joined</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-text-primary">Last Active</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-text-primary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-bg-muted transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-devsuite-primary rounded-full flex items-center justify-center text-text-inverse text-sm font-bold">
                        {getInitials(user)}
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">{getDisplayName(user)}</div>
                        <div className="text-sm text-text-tertiary">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.email_confirmed_at ? 'bg-success-light text-success-dark' : 'bg-warning-light text-warning-dark'
                    }`}>
                      {user.email_confirmed_at ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Recently'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-text-quaternary hover:text-text-primary hover:bg-bg-muted rounded-md transition-all"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user)}
                        disabled={actionLoading[`reset-${user.id}`]}
                        className="p-2 text-text-quaternary hover:text-devsuite-primary hover:bg-devsuite-primary/10 rounded-md transition-all disabled:opacity-50"
                        title="Reset password"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      {user.role !== 'super_admin' && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-text-quaternary hover:text-error hover:bg-error/10 rounded-md transition-all"
                          title="Delete user"
                          disabled={!isAdminEnabled()}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-text-quaternary mb-2">No users found</div>
            <div className="text-sm text-text-tertiary">
              {searchQuery ? `No users match "${searchQuery}"` : 'No users have been loaded'}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showDeleteModal && selectedUser && (
        <UserDeleteModal
          isOpen={showDeleteModal}
          user={selectedUser}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={handleUserDeleted}
        />
      )}

      {showUserModal && (
        <UserFormModal
          isOpen={showUserModal}
          user={editingUser}
          onClose={() => setShowUserModal(false)}
          onSaved={handleUserSaved}
        />
      )}
    </div>
  );
};