/*
  # Fix RLS Policy for Sprints Table

  1. Security Changes
    - Update INSERT policy on `sprints` table to allow public access
    - This enables the application to create default sprints during initialization
    - Maintains existing SELECT, UPDATE, and DELETE policies for authenticated users

  2. Rationale
    - The application needs to create default sprints on first load
    - Users may not be authenticated during initial setup
    - Sprint data is not sensitive and can be publicly created
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON sprints;

-- Create a new policy that allows public INSERT access
CREATE POLICY "Enable insert for all users"
  ON sprints
  FOR INSERT
  TO public
  WITH CHECK (true);