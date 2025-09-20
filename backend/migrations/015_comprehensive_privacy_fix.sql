-- Comprehensive fix for all privacy settings constraints
-- Update all existing data to use new values

-- Update all existing records to use new values
UPDATE user_settings 
SET 
  community_posts_visibility = CASE 
    WHEN community_posts_visibility = 'public' THEN 'everyone'
    WHEN community_posts_visibility = 'private' THEN 'none'
    WHEN community_posts_visibility = 'friends' THEN 'connections'
    ELSE 'everyone'
  END,
  posts_on_profile_visibility = CASE 
    WHEN posts_on_profile_visibility = 'public' THEN 'everyone'
    WHEN posts_on_profile_visibility = 'private' THEN 'none'
    WHEN posts_on_profile_visibility = 'friends' THEN 'connections'
    ELSE 'everyone'
  END,
  photo_upload_restriction = CASE 
    WHEN photo_upload_restriction = 'all' THEN 'everyone'
    WHEN photo_upload_restriction = 'none' THEN 'none'
    WHEN photo_upload_restriction = 'friends' THEN 'connections'
    ELSE 'everyone'
  END;

-- Drop all old constraints
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS check_community_posts_visibility_valid;
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS check_posts_on_profile_visibility_valid;
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS check_photo_upload_restriction_valid;

-- Add new constraints with updated values (only if they don't exist)
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
        WHERE conname = 'check_posts_on_profile_visibility_valid'
    ) THEN
        ALTER TABLE user_settings ADD CONSTRAINT check_posts_on_profile_visibility_valid 
        CHECK (posts_on_profile_visibility IN ('everyone', 'connections', 'none'));
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
