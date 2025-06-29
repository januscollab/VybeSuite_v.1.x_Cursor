/*
  # Fix RLS policies for sprints table

  1. Security Updates
    - Drop existing incorrect RLS policies on sprints table
    - Create new RLS policies using correct auth.uid() function
    - Ensure proper user isolation for all CRUD operations

  2. Policy Details
    - SELECT: Users can view their own sprints
    - INSERT: Users can create sprints with their own user_id
    - UPDATE: Users can update their own sprints
    - DELETE: Users can delete their own sprints

  3. Notes
    - Fixes the "new row violates row-level security policy" error
    - Ensures data isolation between users
    - Uses proper Supabase auth functions
*/

-- Drop existing policies that may be using incorrect functions
DROP POLICY IF EXISTS "Users can view their own sprints" ON sprints;
DROP POLICY IF EXISTS "Users can insert their own sprints" ON sprints;
DROP POLICY IF EXISTS "Users can update their own sprints" ON sprints;
DROP POLICY IF EXISTS "Users can delete their own sprints" ON sprints;

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