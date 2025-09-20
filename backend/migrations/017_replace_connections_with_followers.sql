-- Replace connections system with followers system (like Instagram)
-- This migration drops the user_connections table and creates a user_follows table

-- Drop the connections table and related objects
DROP TRIGGER IF EXISTS update_user_connections_updated_at ON user_connections;
DROP FUNCTION IF EXISTS update_connection_updated_at();
DROP TABLE IF EXISTS user_connections;

-- Create user_follows table (like Instagram followers/following)
CREATE TABLE IF NOT EXISTS user_follows (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Prevent self-following
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_no_self_follow'
    ) THEN
        ALTER TABLE user_follows 
        ADD CONSTRAINT check_no_self_follow 
        CHECK (follower_id != following_id);
    END IF;
END $$;
