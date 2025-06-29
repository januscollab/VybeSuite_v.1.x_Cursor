import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
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
    };
  };
}