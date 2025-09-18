-- Fix schema mismatches for new API routes
-- This migration adds missing tables and columns

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS field VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Create user_onboarding table (missing from initial schema)
CREATE TABLE IF NOT EXISTS user_onboarding (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  age_range VARCHAR(50),
  field_of_study TEXT, -- JSON array stored as text
  academic_level VARCHAR(100),
  university VARCHAR(255),
  preferences TEXT, -- JSON array stored as text
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fix conversations table structure
-- The current schema has conversation_participants but our routes expect user1_id/user2_id
-- Let's add the missing columns for individual conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Fix messages table - change sender_id to author_id to match our routes
ALTER TABLE messages RENAME COLUMN sender_id TO author_id;

-- Update user_settings table to match our routes
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS posts_on_profile_visibility VARCHAR(50) DEFAULT 'public';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT TRUE;

-- Fix applications table - change applied_date to created_at/updated_at
ALTER TABLE applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add missing indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON users(avatar_url);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location);
CREATE INDEX IF NOT EXISTS idx_users_field ON users(field);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user1_id ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2_id ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);

-- Update existing indexes that might be affected
DROP INDEX IF EXISTS idx_messages_sender_id;
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id);

-- Add constraints for individual conversations
-- Ensure that for individual conversations, both user1_id and user2_id are set
ALTER TABLE conversations ADD CONSTRAINT check_individual_conversation_users 
  CHECK (
    (type = 'individual' AND user1_id IS NOT NULL AND user2_id IS NOT NULL) OR
    (type != 'individual')
  );

-- Add constraint to prevent self-conversations
ALTER TABLE conversations ADD CONSTRAINT check_no_self_conversation 
  CHECK (user1_id != user2_id OR user1_id IS NULL OR user2_id IS NULL);

-- Update the posts table to match our routes (author_id instead of author_id)
-- The posts table already has author_id, so this is just for consistency

-- Add missing columns to posts table if needed
ALTER TABLE posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Ensure all timestamp columns have proper defaults
UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE posts SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE posts SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE communities SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE communities SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE applications SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE applications SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE conversations SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE messages SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE user_onboarding SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE user_onboarding SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
