-- Add S3 key fields for private bucket support
-- This allows storing the S3 object key for generating signed URLs

-- Add image_key field to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_key VARCHAR(500);

-- Add image_key field to opportunities table  
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS image_key VARCHAR(500);

-- Add image_key field to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_key VARCHAR(500);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_posts_image_key ON posts(image_key);
CREATE INDEX IF NOT EXISTS idx_opportunities_image_key ON opportunities(image_key);
CREATE INDEX IF NOT EXISTS idx_user_profiles_avatar_key ON user_profiles(avatar_key);
