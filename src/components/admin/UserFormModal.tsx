import { debug } from '../../utils/debug';
import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Shield } from 'lucide-react';
import { supabase, getAdminClient, isAdminEnabled } from '../../lib/supabase';
import { PulsingDotsLoader } from '../LoadingSpinner';
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
interface UserFormModalProps {
    isOpen: boolean;
    user?: User | null;
    onClose: () => void;
    onSaved: () => void;
}
export const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, user, onClose, onSaved }) => {
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
            }
            else {
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
            if (!isAdminEnabled()) {
                throw new Error('Admin operations require service role key configuration');
            }
            const adminClient = getAdminClient();
            if (isEditMode && user) {
                // Update existing user
                const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
                    email: formData.email,
                    user_metadata: {
                        first_name: formData.firstName,
                        last_name: formData.lastName
                    }
                });
                if (updateError)
                    throw updateError;
                // Update user role
                const { error: roleError } = await supabase
                    .from('user_roles')
                    .upsert({
                    user_id: user.id,
                    role: formData.role,
                    assigned_by: (await supabase.auth.getUser()).data.user?.id
                });
                if (roleError)
                    throw roleError;
            }
            else {
                // Create new user
                if (!formData.password) {
                    throw new Error('Password is required for new users');
                }
                const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
                    email: formData.email,
                    password: formData.password,
                    user_metadata: {
                        first_name: formData.firstName,
                        last_name: formData.lastName
                    },
                    email_confirm: true
                });
                if (createError)
                    throw createError;
                // Set user role
                if (newUser.user) {
                    const { error: roleError } = await supabase
                        .from('user_roles')
                        .insert({
                        user_id: newUser.user.id,
                        role: formData.role,
                        assigned_by: (await supabase.auth.getUser()).data.user?.id
                    });
                    if (roleError)
                        throw roleError;
                }
            }
            onSaved();
        }
        catch (err) {
            debug.error("UserFormModal", "Error saving user", { err  });
            setError(err instanceof Error ? err.message : 'Failed to save user');
        }
        finally {
            setLoading(false);
        }
    };
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center p-5">
      <div className="bg-bg-primary rounded-xl shadow-devsuite-modal border border-border-default w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-devsuite-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-text-inverse"/>
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">
                {isEditMode ? 'Edit User' : 'Create New User'}
              </h1>
              <p className="text-sm text-text-tertiary">
                {isEditMode ? 'Update user information and role' : 'Add a new user to the platform'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-3 right-5 w-8 h-8 border-none bg-transparent cursor-pointer rounded-md flex items-center justify-center text-text-quaternary hover:bg-bg-canvas hover:text-text-secondary transition-all">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Error Message */}
          {error && (<div className="bg-error/10 border border-error/20 rounded-lg p-3">
              <p className="text-error text-sm">{error}</p>
            </div>)}

          {/* Admin Warning */}
          {!isAdminEnabled() && (<div className="bg-warning-light border border-warning-dark rounded-lg p-3">
              <p className="text-warning-dark text-sm">
                Service role key required for user management operations
              </p>
            </div>)}

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              First Name
            </label>
            <input type="text" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all" placeholder="Enter first name"/>
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Last Name
            </label>
            <input type="text" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all" placeholder="Enter last name"/>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-quaternary"/>
              <input type="email" required value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full pl-10 pr-3 py-2 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all" placeholder="user@example.com"/>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-quaternary"/>
              <select value={formData.role} onChange={(e) => handleInputChange('role', e.target.value)} className="w-full pl-10 pr-3 py-2 border border-border-default rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all">
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>

          {/* Password (only for new users) */}
          {!isEditMode && (<div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-quaternary"/>
                <input type="password" required value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} className="w-full pl-10 pr-3 py-2 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all" placeholder="Enter secure password" minLength={6}/>
              </div>
              <p className="text-xs text-text-tertiary mt-1">
                Password must be at least 6 characters long
              </p>
            </div>)}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-default flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-muted rounded-lg transition-all" disabled={loading}>
            Cancel
          </button>
          <button type="submit" onClick={handleSubmit} disabled={loading || !isAdminEnabled()} className="flex items-center gap-2 px-4 py-2 bg-devsuite-primary text-text-inverse rounded-lg hover:bg-devsuite-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading && <PulsingDotsLoader size="sm"/>}
            {isEditMode ? 'Update User' : 'Create User'}
          </button>
        </div>
      </div>
    </div>);
};
