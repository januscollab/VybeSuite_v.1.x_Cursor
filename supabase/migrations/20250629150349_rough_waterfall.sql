/*
  # Initialize Default Sprints

  1. Purpose
    - Add default sprints to resolve RLS policy violation during app initialization
    - Ensures the application has the required default sprints without relying on client-side initialization

  2. Default Sprints Added
    - Backlog sprint (non-draggable, position 0)
    - Current Sprint (draggable, position 1)
    - Next Sprint (draggable, position 2)

  3. Security
    - Uses migration context to bypass RLS during initialization
    - Maintains existing RLS policies for runtime operations
*/

-- Insert default sprints if they don't already exist
INSERT INTO sprints (id, title, icon, is_backlog, is_draggable, position)
VALUES 
  ('backlog', 'Backlog', '📋', true, false, 0),
  ('current', 'Current Sprint', '🚀', false, true, 1),
  ('next', 'Next Sprint', '📅', false, true, 2)
ON CONFLICT (id) DO NOTHING;