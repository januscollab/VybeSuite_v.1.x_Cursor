// Enhanced Supabase Configuration with Admin API Support
// Replace src/lib/supabase.ts with this code

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Validation for required keys
if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl.includes('your-project-ref') || 
    supabaseAnonKey.includes('your-anon-key') ||
    supabaseUrl === 'your_supabase_project_url' ||
    supabaseAnonKey === 'your_supabase_anon_key' ||
    supabaseUrl === 'https://your-project-ref.supabase.co' ||
    supabaseAnonKey === 'your-anon-key-here') {
  
  console.warn('⚠️ Supabase configuration may be incomplete');
  console.log('Current URL:', supabaseUrl);
  console.log('Anon Key status:', supabaseAnonKey ? '[SET]' : '[MISSING]');
  console.log('Service Role Key status:', supabaseServiceRoleKey ? '[SET]' : '[MISSING]');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(`
      ❌ Supabase Configuration Error
      
      Missing Supabase environment variables. Please:
      
      1. Go to your Supabase project dashboard: https://supabase.com/dashboard
      2. Navigate to Project Settings > API
      3. Copy your Project URL and keys
      4. Update the .env file in your project root with:
         VITE_SUPABASE_URL=your-actual-project-url
         VITE_SUPABASE_ANON_KEY=your-actual-anon-key
         VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
      5. Restart your development server
      
      Current values:
      - VITE_SUPABASE_URL: ${supabaseUrl || 'undefined'}
      - VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '[SET]' : 'undefined'}
      - VITE_SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? '[SET]' : 'undefined'}
    `);
  }
}

// Regular client for normal operations (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for admin operations (uses service role key)
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Utility function to check if admin operations are available
export const isAdminEnabled = () => {
  if (!supabaseServiceRoleKey) {
    console.warn('⚠️ Admin operations not available: VITE_SUPABASE_SERVICE_ROLE_KEY not configured');
    return false;
  }
  return true;
};

// Helper function to get the appropriate client for admin operations
export const getAdminClient = () => {
  if (!isAdminEnabled() || !supabaseAdmin) {
    throw new Error('Admin operations require VITE_SUPABASE_SERVICE_ROLE_KEY to be configured');
  }
  return supabaseAdmin;
};

// Database types (existing interface)
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