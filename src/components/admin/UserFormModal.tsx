import React, { useState, useEffect } from 'react';
import { X, Save, User, AlertCircle } from 'lucide-react';
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

interface UserFormModalProps {
  isOpen: boolean;
  user?: User | null;
  onClose: () => void;
  onSaved: () => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  user,
  onClose,
  onSaved
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!user;

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          firstName: user.user_metadata.first_name || '',
          lastName: user.user_metadata.last_name || '',
          email: user.email,
          role: user.role,
          password: ''
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          role: 'user',
          password: ''
        });
      }
      setError(null);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditMode && user) {
        // Update existing user
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
          email: formData.email,
          user_metadata: {
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        });

        if (updateError) throw updateError;

        // Update user role
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: user.id,
            role: formData.role,
            assigned_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (roleError) throw roleError;
      } else {
        // Create new user
        if (!formData.password) {
          throw new Error('Password is required for new users');
        }

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          user_metadata: {
            first_name: formData.firstName,
            last_name: formData.lastName
          },
          email_confirm: true
        });

        if (createError) throw createError;

        // Set user role
        if (newUser.user) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: newUser.user.id,
              role: formData.role,
              assigned_by: (await supabase.auth.getUser()).data.user?.id
            });

          if (roleError) throw roleError;
        }
      }

      onSaved();
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center p-5">
      <div className="bg-bg-primary rounded-xl shadow-devsuite-modal border border-border-default w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-devsuite-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-text-inverse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">
                {isEditMode ? 'Edit User' : 'Create User'}
              </h1>
              <p className="text-sm text-text-tertiary">
                {isEditMode ? 'Update user details and permissions' : 'Add a new user to the platform'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-5 w-8 h-8 border-none bg-transparent cursor-pointer rounded-md flex items-center justify-center text-text-quaternary hover:bg-bg-canvas hover:text-text-secondary transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-error-light border border-error rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-error-dark" />
              <span className="text-sm text-error-dark">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
                  placeholder="Smith"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email Address <span className="text-error">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
                placeholder="user@example.com"
                required
              />
            </div>

            {/* Password (only for new users) */}
            {!isEditMode && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Password <span className="text-error">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
                  placeholder="Enter password"
                  required
                  minLength={6}
                />
                <p className="text-xs text-text-tertiary mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>
            )}

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Role <span className="text-error">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
                required
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <p className="text-xs text-text-tertiary mt-1">
                {formData.role === 'super_admin' && 'Full platform management access'}
                {formData.role === 'admin' && 'Limited administrative access'}
                {formData.role === 'user' && 'Standard user access'}
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-default flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded-lg hover:bg-bg-muted transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.email || (!isEditMode && !formData.password)}
            className="flex items-center gap-2 px-4 py-2 bg-devsuite-primary text-text-inverse text-sm font-medium rounded-lg hover:bg-devsuite-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <PulsingDotsLoader size="sm" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEditMode ? 'Update User' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
};