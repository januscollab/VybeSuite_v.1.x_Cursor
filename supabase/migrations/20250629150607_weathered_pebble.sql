/*
  # Add user ownership to sprints table

  1. Schema Changes
    - Add `user_id` column to `sprints` table to track ownership
    - Add foreign key constraint to `auth.users`
    - Add index for performance

  2. Security Updates
    - Update RLS policies to use user ownership
    - Ensure users can only access their own sprints
    - Allow proper initialization of default sprints

  3. Data Migration
    - Handle existing sprints (if any) by setting a default user_id
*/

-- Add user_id column to sprints table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sprints' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE sprints ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_sprints_user_id ON sprints(user_id);

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to delete sprints" ON sprints;
DROP POLICY IF EXISTS "Allow authenticated users to insert sprints" ON sprints;
DROP POLICY IF EXISTS "Allow authenticated users to select sprints" ON sprints;
DROP POLICY IF EXISTS "Allow authenticated users to update sprints" ON sprints;

-- Create new policies with user ownership
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