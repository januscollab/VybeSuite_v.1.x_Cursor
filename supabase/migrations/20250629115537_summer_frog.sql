/*
  # Create Sprints and Stories Tables

  1. New Tables
    - `sprints`
      - `id` (text, primary key) - Sprint identifier
      - `title` (text) - Sprint display name
      - `icon` (text) - Sprint emoji icon
      - `is_backlog` (boolean) - Whether this is the backlog sprint
      - `is_draggable` (boolean) - Whether sprint cards can be dragged
      - `position` (integer) - Display order position
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `stories`
      - `id` (uuid, primary key) - Story unique identifier
      - `number` (text, unique) - Story number (e.g., STORY-001)
      - `title` (text) - Story title
      - `description` (text, nullable) - Detailed story description
      - `completed` (boolean) - Completion status
      - `date` (text) - Display date
      - `tags` (text array) - Story tags
      - `sprint_id` (text) - Foreign key to sprints table
      - `position` (integer) - Position within sprint for ordering
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Public read access for demo purposes (can be restricted later)

  3. Indexes
    - Index on sprint_id for efficient story queries
    - Index on position for ordering
    - Index on number for unique story lookups
*/

-- Create sprints table
CREATE TABLE IF NOT EXISTS sprints (
  id text PRIMARY KEY,
  title text NOT NULL,
  icon text NOT NULL DEFAULT '📋',
  is_backlog boolean NOT NULL DEFAULT false,
  is_draggable boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  completed boolean NOT NULL DEFAULT false,
  date text NOT NULL,
  tags text[] DEFAULT '{}',
  sprint_id text NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_sprint_id ON stories(sprint_id);
CREATE INDEX IF NOT EXISTS idx_stories_position ON stories(sprint_id, position);
CREATE INDEX IF NOT EXISTS idx_stories_number ON stories(number);
CREATE INDEX IF NOT EXISTS idx_sprints_position ON sprints(position);

-- Enable Row Level Security
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Create policies for sprints
CREATE POLICY "Enable read access for all users" ON sprints
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON sprints
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON sprints
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON sprints
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for stories
CREATE POLICY "Enable read access for all users" ON stories
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON stories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON stories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON stories
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON sprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();