/*
  # Add completed_at column to stories table

  1. New Column
    - `completed_at` (timestamp with time zone, nullable)
      - Records when a story was marked as completed
      - Set to current timestamp when story is completed
      - Set to null when story is marked as incomplete

  2. Index
    - Add index on completed_at for performance

  3. Update Function
    - Modify existing trigger to handle completed_at updates
*/

-- Add completed_at column to stories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE stories ADD COLUMN completed_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_stories_completed_at ON stories(completed_at);

-- Create or replace function to handle completion timestamp
CREATE OR REPLACE FUNCTION handle_story_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- If completed status changed to true, set completed_at
    IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
        NEW.completed_at = now();
    -- If completed status changed to false, clear completed_at
    ELSIF NEW.completed = false AND OLD.completed = true THEN
        NEW.completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for handling completion timestamps
DROP TRIGGER IF EXISTS handle_story_completion_trigger ON stories;
CREATE TRIGGER handle_story_completion_trigger
    BEFORE UPDATE ON stories
    FOR EACH ROW
    EXECUTE FUNCTION handle_story_completion();