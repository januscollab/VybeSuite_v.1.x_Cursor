/*
  # Add description field to sprints table

  1. Changes
    - Add `description` column to sprints table
    - Add index for performance if needed

  2. Notes
    - Description is optional (nullable)
    - Allows for better sprint context and documentation
*/

-- Add description column to sprints table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sprints' AND column_name = 'description'
  ) THEN
    ALTER TABLE sprints ADD COLUMN description text DEFAULT NULL;
  END IF;
END $$;