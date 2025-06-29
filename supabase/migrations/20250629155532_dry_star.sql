/*
  # Rebuild Tables with Proper RLS

  This migration completely rebuilds the sprints and stories tables with correct
  Row Level Security policies and user ownership.

  ## Changes Made
  1. Drop existing tables and recreate them with proper schema
  2. Add user_id columns with proper defaults and constraints
  3. Recreate all trigger functions for timestamps and search
  4. Enable RLS and create comprehensive policies
  5. Add proper indexes for performance

  ## Security
  - All tables use user_id for data ownership
  - RLS policies ensure users can only access their own data
  - Stories inherit ownership through sprint relationship
*/

-- Drop existing tables (stories first due to foreign key)
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS sprints CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_story_search_vector() CASCADE;

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function for updating story search vector
CREATE OR REPLACE FUNCTION update_story_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.description, '') || ' ' || 
        COALESCE(NEW.number, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create sprints table
CREATE TABLE sprints (
    id text PRIMARY KEY,
    title text NOT NULL,
    icon text NOT NULL DEFAULT '📋',
    is_backlog boolean NOT NULL DEFAULT false,
    is_draggable boolean NOT NULL DEFAULT false,
    position integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    archived_at timestamptz DEFAULT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid()
);

-- Create stories table
CREATE TABLE stories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    number text UNIQUE NOT NULL,
    title text NOT NULL,
    description text DEFAULT NULL,
    completed boolean NOT NULL DEFAULT false,
    date text NOT NULL,
    tags text[] DEFAULT '{}',
    sprint_id text NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
    position integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    archived_at timestamptz DEFAULT NULL,
    search_vector tsvector
);

-- Create indexes for performance
CREATE INDEX idx_sprints_user_id ON sprints(user_id);
CREATE INDEX idx_sprints_position ON sprints(position);
CREATE INDEX idx_sprints_archived_at ON sprints(archived_at);

CREATE INDEX idx_stories_sprint_id ON stories(sprint_id);
CREATE INDEX idx_stories_position ON stories(sprint_id, position);
CREATE INDEX idx_stories_number ON stories(number);
CREATE INDEX idx_stories_completed ON stories(completed);
CREATE INDEX idx_stories_archived_at ON stories(archived_at);
CREATE INDEX idx_stories_created_at ON stories(created_at);
CREATE INDEX idx_stories_search_vector ON stories USING gin(search_vector);
CREATE INDEX idx_stories_tags ON stories USING gin(tags);
CREATE INDEX idx_stories_completed_archived ON stories(completed, archived_at);
CREATE INDEX idx_stories_sprint_archived ON stories(sprint_id, archived_at);

-- Create triggers
CREATE TRIGGER update_sprints_updated_at
    BEFORE UPDATE ON sprints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON stories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_story_search_vector_trigger
    BEFORE INSERT OR UPDATE ON stories
    FOR EACH ROW
    EXECUTE FUNCTION update_story_search_vector();

-- Enable Row Level Security
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sprints table
CREATE POLICY "Users can view their own sprints"
    ON sprints
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sprints"
    ON sprints
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sprints"
    ON sprints
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sprints"
    ON sprints
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create RLS policies for stories table
-- Stories inherit ownership through sprint relationship
CREATE POLICY "Users can view stories in their sprints"
    ON stories
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM sprints 
        WHERE id = sprint_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can insert stories in their sprints"
    ON stories
    FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM sprints 
        WHERE id = sprint_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can update stories in their sprints"
    ON stories
    FOR UPDATE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM sprints 
        WHERE id = sprint_id AND user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM sprints 
        WHERE id = sprint_id AND user_id = auth.uid()
    ));

CREATE POLICY "Users can delete stories in their sprints"
    ON stories
    FOR DELETE
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM sprints 
        WHERE id = sprint_id AND user_id = auth.uid()
    ));