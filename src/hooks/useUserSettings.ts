import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserSettings, UserProfile } from '../types';

export const useUserSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Fetch user settings and profile data
  const fetchSettings = useCallback(async () => {
    if (!user) return null;

    try {
      setLoading(true);
      setError(null);

      // Fetch user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      let settings: UserSettings;

      if (settingsError && settingsError.code === 'PGRST116') {
        // No settings found, create default settings
        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            story_number_prefix: 'STORY',
            preferred_homepage: 'Sprint Board'
          })
          .select()
          .single();

        if (createError) throw createError;
        settings = {
          id: newSettings.id,
          userId: newSettings.user_id,
          storyNumberPrefix: newSettings.story_number_prefix,
          preferredHomepage: newSettings.preferred_homepage,
          createdAt: newSettings.created_at,
          updatedAt: newSettings.updated_at
        };
      } else if (settingsError) {
        throw settingsError;
      } else {
        settings = {
          id: settingsData.id,
          userId: settingsData.user_id,
          storyNumberPrefix: settingsData.story_number_prefix,
          preferredHomepage: settingsData.preferred_homepage,
          createdAt: settingsData.created_at,
          updatedAt: settingsData.updated_at
        };
      }

      // Get user metadata for name and email
      const firstName = user.user_metadata?.first_name || '';
      const lastName = user.user_metadata?.last_name || '';
      const email = user.email || '';

      const profile: UserProfile = {
        firstName,
        lastName,
        email,
        settings
      };

      setUserProfile(profile);
      return profile;
    } catch (err) {
      console.error('Error fetching user settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user settings');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update user settings and profile
  const updateSettings = useCallback(async (updates: {
    firstName?: string;
    lastName?: string;
    storyNumberPrefix?: string;
    preferredHomepage?: string;
  }) => {
    if (!user || !userProfile) return false;

    try {
      setLoading(true);
      setError(null);

      // Update user metadata if name fields are provided
      if (updates.firstName !== undefined || updates.lastName !== undefined) {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            first_name: updates.firstName ?? userProfile.firstName,
            last_name: updates.lastName ?? userProfile.lastName
          }
        });

        if (authError) throw authError;
      }

      // Update user settings if provided
      if (updates.storyNumberPrefix !== undefined || updates.preferredHomepage !== undefined) {
        const { error: settingsError } = await supabase
          .from('user_settings')
          .update({
            story_number_prefix: updates.storyNumberPrefix ?? userProfile.settings.storyNumberPrefix,
            preferred_homepage: updates.preferredHomepage ?? userProfile.settings.preferredHomepage
          })
          .eq('user_id', user.id);

        if (settingsError) throw settingsError;
      }

      // Refresh the profile data
      await fetchSettings();
      return true;
    } catch (err) {
      console.error('Error updating user settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user settings');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, userProfile, fetchSettings]);

  // Change password
  const changePassword = useCallback(async (newPassword: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err instanceof Error ? err.message : 'Failed to change password');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load settings on mount
  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user, fetchSettings]);

  return {
    userProfile,
    loading,
    error,
    fetchSettings,
    updateSettings,
    changePassword
  };
};