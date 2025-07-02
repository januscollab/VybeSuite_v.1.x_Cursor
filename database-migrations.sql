-- =====================================================
-- USER PREFERENCES ENHANCEMENT MIGRATION
-- =====================================================
-- This migration adds AI settings and preferences to the user_settings table
-- to enable comprehensive user preference management across sessions

-- Add AI settings columns to user_settings table
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS openai_api_key TEXT DEFAULT '';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS anthropic_api_key TEXT DEFAULT '';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS default_ai_provider TEXT DEFAULT 'openai';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS selected_openai_model TEXT DEFAULT 'gpt-4o';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS selected_anthropic_model TEXT DEFAULT 'claude-3-5-sonnet-20241022';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS include_github_code_review BOOLEAN DEFAULT false;

-- Add additional user preferences
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "browser": true, "story_updates": true, "sprint_updates": true}';

-- Add constraint to ensure valid AI provider
ALTER TABLE user_settings ADD CONSTRAINT valid_ai_provider 
    CHECK (default_ai_provider IN ('openai', 'anthropic'));

-- Add constraint to ensure valid theme
ALTER TABLE user_settings ADD CONSTRAINT valid_theme 
    CHECK (theme_preference IN ('light', 'dark', 'system'));

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Update RLS (Row Level Security) policies if they don't exist
DO $$ 
BEGIN
    -- Enable RLS on user_settings table
    ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for users to access their own settings
    CREATE POLICY "Users can access their own settings" ON user_settings
        FOR ALL USING (auth.uid() = user_id);
        
EXCEPTION 
    WHEN duplicate_object THEN 
        NULL; -- Policy already exists, ignore
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_settings TO authenticated;

-- Comment on new columns
COMMENT ON COLUMN user_settings.openai_api_key IS 'Encrypted OpenAI API key for AI story generation';
COMMENT ON COLUMN user_settings.anthropic_api_key IS 'Encrypted Anthropic API key for AI story generation';
COMMENT ON COLUMN user_settings.default_ai_provider IS 'Default AI provider preference (openai or anthropic)';
COMMENT ON COLUMN user_settings.selected_openai_model IS 'Selected OpenAI model for story generation';
COMMENT ON COLUMN user_settings.selected_anthropic_model IS 'Selected Anthropic model for story generation';
COMMENT ON COLUMN user_settings.include_github_code_review IS 'Include GitHub code review context in AI prompts';
COMMENT ON COLUMN user_settings.theme_preference IS 'User interface theme preference';
COMMENT ON COLUMN user_settings.notification_preferences IS 'JSON object containing notification preferences';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the migration was successful:

-- 1. Check table structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_settings' 
-- ORDER BY ordinal_position;

-- 2. Check constraints
-- SELECT conname, contype, consrc 
-- FROM pg_constraint 
-- WHERE conrelid = 'user_settings'::regclass;

-- 3. Check policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'user_settings'; 