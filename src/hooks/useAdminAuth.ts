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

      // Temporarily disable admin role checking due to RLS policy recursion
      // This needs to be fixed in Supabase RLS policies
      console.warn('Admin role checking disabled due to RLS policy recursion');
      setUserRole('user');
      setIsAdmin(false);
      
      // TODO: Fix RLS policies in Supabase dashboard to resolve infinite recursion
      // The user_roles table policies are creating a circular dependency
      
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