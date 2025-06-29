/*
  # Fix RLS policies for sprints table

  1. Security Updates
    - Drop existing RLS policies that may be causing conflicts
    - Create new comprehensive policies for authenticated users
    - Ensure INSERT, UPDATE, SELECT, and DELETE operations work properly
    - Fix upsert operation compatibility

  2. Changes Made
    - Remove potentially conflicting policies
    - Add clear, permissive policies for authenticated users
    - Ensure policies work with Supabase's upsert operations
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON sprints;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sprints;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON sprints;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON sprints;

-- Create comprehensive policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users on sprints"
  ON sprints
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;