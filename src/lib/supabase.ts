import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// FIXED: More lenient validation - only check if values exist and aren't obvious placeholders
if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl.includes('your-project-ref') || 
    supabaseAnonKey.includes('your-anon-key') ||
    supabaseUrl === 'your_supabase_project_url' ||
    supabaseAnonKey === 'your_supabase_anon_key' ||
    supabaseUrl === 'https://your-project-ref.supabase.co' ||
    supabaseAnonKey === 'your-anon-key-here') {
  
  console.warn('⚠️ Supabase configuration may be incomplete');
  console.log('Current URL:', supabaseUrl);
  console.log('Key status:', supabaseAnonKey ? '[SET]' : '[MISSING]');
  
  // Don't throw error immediately - let it try to connect first
  // Only throw if both are completely missing
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(`
      ❌ Supabase Configuration Error
      
      Missing Supabase environment variables. Please:
      
      1. Go to your Supabase project dashboard: https://supabase.com/dashboard
      2. Navigate to Project Settings > API
      3. Copy your Project URL and anon/public key
      4. Update the .env file in your project root with:
         VITE_SUPABASE_URL=your-actual-project-url
         VITE_SUPABASE_ANON_KEY=your-actual-anon-key
      5. Restart your development server
      
      Current values:
      - VITE_SUPABASE_URL: ${supabaseUrl || 'undefined'}
      - VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '[SET]' : 'undefined'}
    `);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
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
    };
  };
}