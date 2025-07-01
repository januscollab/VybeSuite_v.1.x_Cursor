// Enhanced Supabase Configuration with Development Mode Support
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Development mode detection
const isDevelopmentMode = !supabaseUrl || !supabaseAnonKey || 
  supabaseUrl.includes('your-project-ref') || 
  supabaseAnonKey.includes('your-anon-key') ||
  supabaseUrl === 'your_supabase_project_url' ||
  supabaseAnonKey === 'your_supabase_anon_key' ||
  supabaseUrl === 'https://your-project-ref.supabase.co' ||
  supabaseAnonKey === 'your-anon-key-here' ||
  supabaseUrl === 'https://placeholder.supabase.co' ||
  supabaseAnonKey === 'placeholder-anon-key';

if (isDevelopmentMode) {
  console.log('🔧 Running in Development Mode (Supabase not configured)');
  console.log('📋 To enable full features, set up Supabase credentials in .env file');
}

// Mock Supabase client for development
const createMockSupabaseClient = () => {
  const mockError = new Error('Supabase not configured - running in development mode');
  
  return {
    from: (table: string) => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: mockError }),
      update: () => Promise.resolve({ data: null, error: mockError }),
      delete: () => Promise.resolve({ data: null, error: mockError }),
      eq: () => Promise.resolve({ data: [], error: null }),
      order: () => Promise.resolve({ data: [], error: null }),
      limit: () => Promise.resolve({ data: [], error: null }),
      is: () => Promise.resolve({ data: [], error: null })
    }),
    auth: {
      signUp: () => Promise.resolve({ data: null, error: mockError }),
      signIn: () => Promise.resolve({ data: null, error: mockError }),
      signOut: () => Promise.resolve({ error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: (callback: any) => {
        // Immediately call the callback with no session in development mode
        setTimeout(() => callback('SIGNED_OUT', null), 0);
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      unsubscribe: () => {}
    })
  };
};

// Create appropriate client based on configuration
export const supabase = isDevelopmentMode 
  ? createMockSupabaseClient()
  : createClient(supabaseUrl!, supabaseAnonKey!);

// Admin client for admin operations
export const supabaseAdmin = (!isDevelopmentMode && supabaseServiceRoleKey) 
  ? createClient(supabaseUrl!, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Utility functions
export const isAdminEnabled = () => !isDevelopmentMode && !!supabaseServiceRoleKey;
export const isDevelopment = () => isDevelopmentMode;

export const getAdminClient = () => {
  if (!isAdminEnabled() || !supabaseAdmin) {
    throw new Error('Admin operations require VITE_SUPABASE_SERVICE_ROLE_KEY to be configured');
  }
  return supabaseAdmin;
};

// Database types (keeping existing interface)
export interface Database {
  public: {
    Tables: {
      sprints: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          icon: string;
          is_backlog: boolean;
          is_draggable: boolean;
          position: number;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          icon: string;
          is_backlog?: boolean;
          is_draggable?: boolean;
          position?: number;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          icon?: string;
          is_backlog?: boolean;
          is_draggable?: boolean;
          position?: number;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
          user_id?: string | null;
        };
      };
      stories: {
        Row: {
          id: string;
          number: string;
          title: string;
          description: string | null;
          completed: boolean;
          date: string;
          tags: string[];
          sprint_id: string;
          position: number;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          number: string;
          title: string;
          description?: string | null;
          completed?: boolean;
          date: string;
          tags?: string[];
          sprint_id: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          number?: string;
          title?: string;
          description?: string | null;
          completed?: boolean;
          date?: string;
          tags?: string[];
          sprint_id?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
          completed_at?: string | null;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          story_number_prefix: string;
          preferred_homepage: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          story_number_prefix?: string;
          preferred_homepage?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          story_number_prefix?: string;
          preferred_homepage?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          assigned_by: string | null;
          assigned_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: string;
          assigned_by?: string | null;
          assigned_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          assigned_by?: string | null;
          assigned_at?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      user_roles_view: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          assigned_by: string | null;
          assigned_at: string;
          created_at: string;
          email: string;
          user_created_at: string;
        };
      };
    };
    Functions: {
      is_super_admin: {
        Args: { user_uuid?: string };
        Returns: boolean;
      };
      get_user_role: {
        Args: { user_uuid?: string };
        Returns: string;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
}