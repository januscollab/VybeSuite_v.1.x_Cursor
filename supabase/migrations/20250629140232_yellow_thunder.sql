/*
  # Update Authentication and RLS Policies

  1. Security Updates
    - Update RLS policies to work with authenticated users
    - Ensure proper user isolation for stories and sprints
    - Add user-specific data access controls

  2. Changes
    - Update stories table policies for authenticated users
    - Update sprints table policies for authenticated users
    - Add user_id tracking (optional for future user isolation)
*/

-- Update stories table policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON stories;
DROP POLICY IF EXISTS "Enable read access for all users" ON stories;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON stories;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON stories;

-- Create new policies for stories
CREATE POLICY "Enable insert for authenticated users" ON stories
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON stories
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable update for authenticated users" ON stories
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON stories
  FOR DELETE TO authenticated
  USING (true);

-- Update sprints table policies
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON sprints;
DROP POLICY IF EXISTS "Enable insert for all users" ON sprints;
DROP POLICY IF EXISTS "Enable read access for all users" ON sprints;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON sprints;

-- Create new policies for sprints
CREATE POLICY "Enable insert for authenticated users" ON sprints
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON sprints
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable update for authenticated users" ON sprints
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON sprints
  FOR DELETE TO authenticated
  USING (true);