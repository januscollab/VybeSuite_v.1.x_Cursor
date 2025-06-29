/*
  # Recreate Priority Sprint and Lock Position

  1. Database Changes
    - Ensure Priority Sprint exists with locked position
    - Update existing Priority Sprints to correct position
    - Add constraint to prevent Priority Sprint deletion

  2. Security
    - Maintain existing RLS policies
    - Ensure user ownership is preserved
*/

-- Function to ensure Priority Sprint exists for each user
CREATE OR REPLACE FUNCTION ensure_priority_sprint_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert Priority Sprint if it doesn't exist for this user
  INSERT INTO sprints (id, title, icon, is_backlog, is_draggable, position, user_id)
  VALUES ('priority', 'Priority Sprint', '🔥', false, false, 0, NEW.id)
  ON CONFLICT (id) DO UPDATE SET
    position = 0,
    is_backlog = false,
    is_draggable = false,
    title = 'Priority Sprint',
    icon = '🔥'
  WHERE sprints.user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure Priority Sprint exists when user is created
DROP TRIGGER IF EXISTS ensure_priority_sprint_on_user_creation ON auth.users;
CREATE TRIGGER ensure_priority_sprint_on_user_creation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_priority_sprint_exists();

-- Update existing Priority Sprints to ensure correct position and properties
UPDATE sprints 
SET 
  position = 0,
  is_backlog = false,
  is_draggable = false,
  title = 'Priority Sprint',
  icon = '🔥'
WHERE id = 'priority';

-- Ensure all other sprints have position >= 1
UPDATE sprints 
SET position = position + 1
WHERE id != 'priority' AND position < 1;

-- Create function to prevent Priority Sprint deletion and position changes
CREATE OR REPLACE FUNCTION protect_priority_sprint()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent deletion of Priority Sprint
  IF TG_OP = 'DELETE' AND OLD.id = 'priority' THEN
    RAISE EXCEPTION 'Priority Sprint cannot be deleted';
  END IF;
  
  -- Prevent changing Priority Sprint position away from 0
  IF TG_OP = 'UPDATE' AND NEW.id = 'priority' THEN
    NEW.position = 0;
    NEW.is_backlog = false;
    NEW.is_draggable = false;
  END IF;
  
  -- Ensure no other sprint can have position 0
  IF TG_OP = 'UPDATE' AND NEW.id != 'priority' AND NEW.position = 0 THEN
    NEW.position = 1;
  END IF;
  
  IF TG_OP = 'INSERT' AND NEW.id != 'priority' AND NEW.position = 0 THEN
    NEW.position = 1;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to protect Priority Sprint
DROP TRIGGER IF EXISTS protect_priority_sprint_trigger ON sprints;
CREATE TRIGGER protect_priority_sprint_trigger
  BEFORE UPDATE OR DELETE ON sprints
  FOR EACH ROW
  EXECUTE FUNCTION protect_priority_sprint();

-- Create trigger to enforce position rules on insert
DROP TRIGGER IF EXISTS enforce_sprint_position_on_insert ON sprints;
CREATE TRIGGER enforce_sprint_position_on_insert
  BEFORE INSERT ON sprints
  FOR EACH ROW
  EXECUTE FUNCTION protect_priority_sprint();