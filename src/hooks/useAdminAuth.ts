import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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

      // Check user role from database
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      const role = data?.role || 'user';
      setUserRole(role);
      setIsAdmin(role === 'super_admin');
      
      console.log('User role check:', { userId: user.id, role, isAdmin: role === 'super_admin' });
    } catch (err) {
      console.error('Error checking admin role:', err);
      setIsAdmin(false);
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check role when user changes
  useEffect(() => {
    checkAdminRole();
  }, [checkAdminRole]);

  return {
    isAdmin,
    userRole,
    loading,
    checkAdminRole
  };
};