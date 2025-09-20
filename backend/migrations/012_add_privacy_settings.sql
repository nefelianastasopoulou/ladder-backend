-- Add new privacy settings columns to user_settings table
-- This migration adds opportunities_on_profile_visibility and applications_on_profile_visibility

-- Add new privacy settings columns
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS opportunities_on_profile_visibility VARCHAR(20) DEFAULT 'everyone',
ADD COLUMN IF NOT EXISTS applications_on_profile_visibility VARCHAR(20) DEFAULT 'everyone';

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_user_settings_opportunities_visibility ON user_settings(opportunities_on_profile_visibility);
CREATE INDEX IF NOT EXISTS idx_user_settings_applications_visibility ON user_settings(applications_on_profile_visibility);

-- Update existing records to have default values
UPDATE user_settings 
SET 
  opportunities_on_profile_visibility = 'everyone',
  applications_on_profile_visibility = 'everyone'
WHERE 
  opportunities_on_profile_visibility IS NULL 
  OR applications_on_profile_visibility IS NULL;
