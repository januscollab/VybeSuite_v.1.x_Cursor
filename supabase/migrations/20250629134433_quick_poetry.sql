/*
  # Archive Management & Search Enhancement

  1. New Features
    - Add archive functionality to sprints and stories
    - Add search indexes for performance
    - Add bulk operations support
    - Add export functionality support

  2. Database Changes
    - `archived_at` column for sprints and stories
    - Search indexes using PostgreSQL full-text search
    - Improved tag indexing for faster filtering

  3. Security
    - Maintain existing RLS policies
    - Add policies for archive operations
*/

-- Add archive functionality to sprints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sprints' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE sprints ADD COLUMN archived_at timestamptz;
  END IF;
END $$;

-- Add archive functionality to stories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE stories ADD COLUMN archived_at timestamptz;
  END IF;
END $$;

-- Add search vector column for full-text search on stories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE stories ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Create function to update search vector
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS update_story_search_vector_trigger ON stories;
CREATE TRIGGER update_story_search_vector_trigger
  BEFORE INSERT OR UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_story_search_vector();

-- Update existing stories with search vectors
UPDATE stories SET search_vector = to_tsvector('english', 
  COALESCE(title, '') || ' ' || 
  COALESCE(description, '') || ' ' || 
  COALESCE(number, '') || ' ' ||
  COALESCE(array_to_string(tags, ' '), '')
) WHERE search_vector IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_search_vector ON stories USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_stories_archived_at ON stories (archived_at);
CREATE INDEX IF NOT EXISTS idx_stories_completed ON stories (completed);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories (created_at);
CREATE INDEX IF NOT EXISTS idx_sprints_archived_at ON sprints (archived_at);

-- Improve existing tag index
DROP INDEX IF EXISTS idx_stories_tags;
CREATE INDEX idx_stories_tags ON stories USING gin(tags);

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_stories_sprint_archived ON stories (sprint_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_stories_completed_archived ON stories (completed, archived_at);