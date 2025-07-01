// Fixed useAdminAuth Hook - Resolves RLS Policy Recursion Issue
// src/hooks/useAdminAuth.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// VERBOSE_LOGGING: Set to true only when debugging specific issues  
const VERBOSE_LOGGING = false;

export interface UserRole {
  id: string;
  userId: string;
  role: string;
  assignedBy: string | null;
  assignedAt: string;
  createdAt: string;
}

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>('user');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const checkAdminRole = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setUserRole('user');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use the security definer function to avoid RLS recursion
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { user_uuid: user.id });

      if (roleError) {
        console.error('Error checking user role:', roleError);
        throw roleError;
      }

      const role = roleData || 'user';
      setUserRole(role);
      setIsAdmin(role === 'super_admin' || role === 'admin');

      if (VERBOSE_LOGGING) {
      console.log(`✅ Admin role check completed for ${user.email}: ${role}`);
    }
      
    } catch (err) {
      console.error('Error checking admin role:', err);
      setError(err instanceof Error ? err.message : 'Failed to check admin role');
      setIsAdmin(false);
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Alternative method using direct function call for super admin check
  const checkIsSuperAdmin = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data: isSuper, error } = await supabase
        .rpc('is_super_admin', { user_uuid: user.id });

      if (error) {
        console.error('Error checking super admin status:', error);
        return false;
      }

      return isSuper || false;
    } catch (err) {
      console.error('Error in checkIsSuperAdmin:', err);
      return false;
    }
  }, [user]);

  // Get all user roles (for admin dashboard)
  const getAllUserRoles = useCallback(async () => {
    if (!isAdmin) return [];

    try {
      const { data, error } = await supabase
        .from('user_roles_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching user roles:', err);
      return [];
    }
  }, [isAdmin]);

  // Update user role (admin only)
  const updateUserRole = useCallback(async (userId: string, newRole: string) => {
    if (!isAdmin) throw new Error('Permission denied: Admin access required');

    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole,
          assigned_by: user?.id,
          assigned_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating user role:', err);
      throw err;
    }
  }, [isAdmin, user]);

  // Check role when user changes
  useEffect(() => {
    checkAdminRole();
  }, [checkAdminRole]);

  return {
    isAdmin,
    userRole,
    loading,
    error,
    checkAdminRole,
    checkIsSuperAdmin,
    getAllUserRoles,
    updateUserRole
  };
};