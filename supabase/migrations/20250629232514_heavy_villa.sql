/*
  # Ensure Backlog Sprint Exists for All Users

  1. Migration Purpose
    - Ensures every user has a "Backlog - Future Enhancements" sprint
    - Sets correct properties: is_backlog=true, is_draggable=false
    - Positions backlog sprint at the end (highest position)
    - Prevents duplicate backlog sprints

  2. Sprint Properties
    - Title: "Backlog - Future Enhancements"
    - Icon: 📋
    - is_backlog: true
    - is_draggable: false (NEVER draggable)
    - Position: Always last (highest position number)

  3. Safety Features
    - Only creates backlog if it doesn't exist
    - Uses proper user_id association
    - Handles position conflicts gracefully
*/

-- Function to ensure backlog sprint exists for a user
CREATE OR REPLACE FUNCTION ensure_user_backlog_sprint(target_user_id uuid)
RETURNS void AS $$
DECLARE
  backlog_exists boolean;
  max_position integer;
BEGIN
  -- Check if user already has a backlog sprint
  SELECT EXISTS(
    SELECT 1 FROM sprints 
    WHERE user_id = target_user_id 
    AND is_backlog = true 
    AND archived_at IS NULL
  ) INTO backlog_exists;

  -- If no backlog exists, create one
  IF NOT backlog_exists THEN
    -- Get the highest position for this user
    SELECT COALESCE(MAX(position), 0) INTO max_position
    FROM sprints 
    WHERE user_id = target_user_id 
    AND archived_at IS NULL;

    -- Insert the backlog sprint
    INSERT INTO sprints (
      id,
      title,
      description,
      icon,
      is_backlog,
      is_draggable,
      position,
      user_id,
      created_at,
      updated_at
    ) VALUES (
      'backlog-' || target_user_id::text,
      'Backlog - Future Enhancements',
      'Future enhancements and feature ideas',
      '📋',
      true,
      false,
      max_position + 1,
      target_user_id,
      now(),
      now()
    );

    RAISE NOTICE 'Created backlog sprint for user %', target_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Ensure backlog sprint exists for all existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Loop through all users who have sprints but no backlog
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM sprints 
    WHERE user_id IS NOT NULL 
    AND archived_at IS NULL
    AND user_id NOT IN (
      SELECT user_id 
      FROM sprints 
      WHERE is_backlog = true 
      AND archived_at IS NULL 
      AND user_id IS NOT NULL
    )
  LOOP
    PERFORM ensure_user_backlog_sprint(user_record.user_id);
  END LOOP;
END $$;

-- Create trigger to automatically create backlog sprint for new users
CREATE OR REPLACE FUNCTION create_backlog_sprint_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new sprint is created for a user, ensure they have a backlog
  IF NEW.user_id IS NOT NULL AND NOT NEW.is_backlog THEN
    PERFORM ensure_user_backlog_sprint(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS ensure_backlog_sprint_trigger ON sprints;

-- Create trigger for new sprint insertions
CREATE TRIGGER ensure_backlog_sprint_trigger
  AFTER INSERT ON sprints
  FOR EACH ROW
  EXECUTE FUNCTION create_backlog_sprint_for_new_user();

-- Add constraint to prevent multiple backlog sprints per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_backlog_per_user'
    AND table_name = 'sprints'
  ) THEN
    ALTER TABLE sprints 
    ADD CONSTRAINT unique_backlog_per_user 
    UNIQUE (user_id, is_backlog) 
    DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- Update any existing backlog sprints to ensure correct properties
UPDATE sprints 
SET 
  title = 'Backlog - Future Enhancements',
  icon = '📋',
  is_draggable = false,
  updated_at = now()
WHERE is_backlog = true 
AND archived_at IS NULL;

-- Ensure backlog sprints are positioned last for each user
DO $$
DECLARE
  user_record RECORD;
  max_pos integer;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM sprints 
    WHERE user_id IS NOT NULL 
    AND archived_at IS NULL
  LOOP
    -- Get max position for non-backlog sprints
    SELECT COALESCE(MAX(position), 0) INTO max_pos
    FROM sprints 
    WHERE user_id = user_record.user_id 
    AND is_backlog = false 
    AND archived_at IS NULL;
    
    -- Update backlog position to be last
    UPDATE sprints 
    SET position = max_pos + 1,
        updated_at = now()
    WHERE user_id = user_record.user_id 
    AND is_backlog = true 
    AND archived_at IS NULL;
  END LOOP;
END $$;