-- Fix missing user_settings records
-- This migration ensures all users have privacy settings records

-- Create user_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_posts_visibility VARCHAR(20) DEFAULT 'everyone',
  opportunities_on_profile_visibility VARCHAR(20) DEFAULT 'everyone',
  applications_on_profile_visibility VARCHAR(20) DEFAULT 'everyone',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update existing records to fix any constraint violations
UPDATE user_settings 
SET 
  photo_upload_restriction = CASE 
    WHEN photo_upload_restriction = 'all' THEN 'everyone'
    WHEN photo_upload_restriction = 'none' THEN 'none'
    WHEN photo_upload_restriction = 'friends' THEN 'connections'
    ELSE 'everyone'
  END,
  community_posts_visibility = CASE 
    WHEN community_posts_visibility = 'public' THEN 'everyone'
    WHEN community_posts_visibility = 'private' THEN 'none'
    WHEN community_posts_visibility = 'friends' THEN 'connections'
    ELSE 'everyone'
  END,
  opportunities_on_profile_visibility = CASE 
    WHEN opportunities_on_profile_visibility = 'public' THEN 'everyone'
    WHEN opportunities_on_profile_visibility = 'private' THEN 'none'
    WHEN opportunities_on_profile_visibility = 'friends' THEN 'connections'
    ELSE 'everyone'
  END,
  applications_on_profile_visibility = CASE 
    WHEN applications_on_profile_visibility = 'public' THEN 'everyone'
    WHEN applications_on_profile_visibility = 'private' THEN 'none'
    WHEN applications_on_profile_visibility = 'friends' THEN 'connections'
    ELSE 'everyone'
  END
WHERE 
  photo_upload_restriction IN ('all', 'public', 'private', 'friends')
  OR community_posts_visibility IN ('public', 'private', 'friends')
  OR opportunities_on_profile_visibility IN ('public', 'private', 'friends')
  OR applications_on_profile_visibility IN ('public', 'private', 'friends');

-- Insert missing user_settings records for all users who don't have them
INSERT INTO user_settings (user_id, community_posts_visibility, opportunities_on_profile_visibility, applications_on_profile_visibility)
SELECT 
  u.id,
  'everyone',
  'everyone', 
  'everyone'
FROM users u
LEFT JOIN user_settings us ON u.id = us.user_id
WHERE us.user_id IS NULL;

-- Add constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_community_posts_visibility_valid'
    ) THEN
        ALTER TABLE user_settings ADD CONSTRAINT check_community_posts_visibility_valid 
        CHECK (community_posts_visibility IN ('everyone', 'connections', 'none'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_opportunities_visibility_valid'
    ) THEN
        ALTER TABLE user_settings ADD CONSTRAINT check_opportunities_visibility_valid 
        CHECK (opportunities_on_profile_visibility IN ('everyone', 'connections', 'none'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_applications_visibility_valid'
    ) THEN
        ALTER TABLE user_settings ADD CONSTRAINT check_applications_visibility_valid 
        CHECK (applications_on_profile_visibility IN ('everyone', 'connections', 'none'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_photo_upload_restriction_valid'
    ) THEN
        ALTER TABLE user_settings ADD CONSTRAINT check_photo_upload_restriction_valid 
        CHECK (photo_upload_restriction IN ('everyone', 'connections', 'none'));
    END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_community_posts ON user_settings(community_posts_visibility);
CREATE INDEX IF NOT EXISTS idx_user_settings_opportunities ON user_settings(opportunities_on_profile_visibility);
CREATE INDEX IF NOT EXISTS idx_user_settings_applications ON user_settings(applications_on_profile_visibility);
