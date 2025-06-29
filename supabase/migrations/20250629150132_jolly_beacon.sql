/*
  # Fix RLS policies for sprints table

  1. Security Changes
    - Drop the existing "ALL" policy which may not be working correctly
    - Add explicit policies for SELECT, INSERT, UPDATE, and DELETE operations
    - Ensure authenticated users can perform all operations on sprints table

  2. Changes Made
    - Remove generic "ALL" policy
    - Add specific policies for each CRUD operation
    - Maintain same security level (authenticated users only)
*/

-- Drop the existing policy that might not be working correctly
DROP POLICY IF EXISTS "Allow all operations for authenticated users on sprints" ON sprints;

-- Create explicit policies for each operation type
CREATE POLICY "Enable read access for authenticated users on sprints"
  ON sprints
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users on sprints"
  ON sprints
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on sprints"
  ON sprints
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users on sprints"
  ON sprints
  FOR DELETE
  TO authenticated
  USING (true);