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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_community_posts ON user_settings(community_posts_visibility);
CREATE INDEX IF NOT EXISTS idx_user_settings_opportunities ON user_settings(opportunities_on_profile_visibility);
CREATE INDEX IF NOT EXISTS idx_user_settings_applications ON user_settings(applications_on_profile_visibility);
