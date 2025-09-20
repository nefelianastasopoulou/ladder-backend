-- Fix privacy settings constraints to support new values
-- This migration updates the check constraints for privacy settings

-- First, update any existing records that might have old values
UPDATE user_settings 
SET 
  community_posts_visibility = CASE 
    WHEN community_posts_visibility = 'public' THEN 'everyone'
    WHEN community_posts_visibility = 'private' THEN 'none'
    WHEN community_posts_visibility = 'friends' THEN 'connections'
    ELSE 'everyone'
  END
WHERE community_posts_visibility IN ('public', 'private', 'friends');

-- Drop the old constraint
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS check_community_posts_visibility_valid;

-- Add new constraint with updated values (only if it doesn't exist)
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

-- Add constraints for the new privacy fields (only if they don't exist)
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
