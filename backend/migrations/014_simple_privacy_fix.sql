-- Simple fix for privacy settings constraints
-- Update existing data and fix constraints

-- Update existing records
UPDATE user_settings 
SET community_posts_visibility = 'everyone'
WHERE community_posts_visibility = 'public';

-- Drop the old constraint
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS check_community_posts_visibility_valid;

-- Add new constraint
ALTER TABLE user_settings ADD CONSTRAINT check_community_posts_visibility_valid 
  CHECK (community_posts_visibility IN ('everyone', 'connections', 'none'));
