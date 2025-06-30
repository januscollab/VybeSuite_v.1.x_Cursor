import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Trash2, Edit, UserX, UserCheck, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
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

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Get all users from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      // Get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (rolesError) throw rolesError;

      // Combine user data with roles
      const usersWithRoles = authUsers.users.map(user => ({
        id: user.id,
        email: user.email || '',
        role: userRoles.find(r => r.user_id === user.id)?.role || 'user',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        user_metadata: user.user_metadata || {}
      }));

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error loading users:', err);
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

  const handleToggleUserStatus = async (user: User) => {
    const actionId = `toggle-${user.id}`;
    setActionLoading(prev => ({ ...prev, [actionId]: true }));

    try {
      // This would require admin API access to suspend/activate users
      // For now, we'll show a placeholder
      console.log('Toggle user status:', user.id);
      // await supabase.auth.admin.updateUserById(user.id, { banned: !user.banned });
      // loadUsers();
    } catch (err) {
      console.error('Error toggling user status:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionId]: false }));
    }
  };

  const handleResetPassword = async (user: User) => {
    const actionId = `reset-${user.id}`;
    setActionLoading(prev => ({ ...prev, [actionId]: true }));

    try {
      const { error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: user.email
      });

      if (error) throw error;

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
    return fullName || user.email;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">User Management</h2>
          <p className="text-text-tertiary">Manage platform users and permissions</p>
        </div>
        <button
          onClick={handleCreateUser}
          className="flex items-center gap-2 px-4 py-2 bg-devsuite-primary text-text-inverse rounded-lg hover:bg-devsuite-primary-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-bg-primary rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-quaternary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-4 py-3 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
            />
          </div>
        </div>
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
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
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
              {searchQuery ? 'Try adjusting your search criteria' : 'No users have been created yet'}
            </div>
          </div>
        )}
      </div>

      {/* User Delete Modal */}
      {selectedUser && (
        <UserDeleteModal
          isOpen={showDeleteModal}
          user={selectedUser}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={handleUserDeleted}
        />
      )}

      {/* User Form Modal */}
      <UserFormModal
        isOpen={showUserModal}
        user={editingUser}
        onClose={() => setShowUserModal(false)}
        onSaved={handleUserSaved}
      />
    </div>
  );
};