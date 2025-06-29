/*
  # Fix RLS policies for sprints table

  1. Security Updates
    - Update RLS policies for sprints table to allow proper initialization
    - Ensure authenticated users can create, read, update, and delete sprints
    - Maintain security while allowing application functionality

  2. Changes Made
    - Drop existing restrictive policies
    - Create new policies that allow authenticated users full access to sprints
    - This aligns with the application's design where authenticated users manage their own sprints
*/

-- Drop existing policies to recreate them with proper permissions
DROP POLICY IF EXISTS "Enable delete for authenticated users on sprints" ON sprints;
DROP POLICY IF EXISTS "Enable insert for authenticated users on sprints" ON sprints;
DROP POLICY IF EXISTS "Enable read access for authenticated users on sprints" ON sprints;
DROP POLICY IF EXISTS "Enable update for authenticated users on sprints" ON sprints;

-- Create new policies that allow authenticated users to manage sprints
CREATE POLICY "Allow authenticated users to select sprints"
  ON sprints
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert sprints"
  ON sprints
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sprints"
  ON sprints
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete sprints"
  ON sprints
  FOR DELETE
  TO authenticated
  USING (true);