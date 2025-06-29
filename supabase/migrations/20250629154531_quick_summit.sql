/*
  # Fix RLS policies for sprints table

  1. Security Updates
    - Drop existing policies that use incorrect uid() function
    - Create new policies using correct auth.uid() function
    - Ensure proper access control for authenticated users

  2. Policy Changes
    - INSERT: Allow authenticated users to create sprints with their user_id
    - SELECT: Allow authenticated users to view their own sprints
    - UPDATE: Allow authenticated users to update their own sprints
    - DELETE: Allow authenticated users to delete their own sprints
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can delete their own sprints" ON sprints;
DROP POLICY IF EXISTS "Users can insert their own sprints" ON sprints;
DROP POLICY IF EXISTS "Users can update their own sprints" ON sprints;
DROP POLICY IF EXISTS "Users can view their own sprints" ON sprints;

-- Create new policies with correct auth.uid() function
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