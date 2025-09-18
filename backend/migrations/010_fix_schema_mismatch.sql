-- Fix schema mismatch between migrations and routes
-- This migration updates the database schema to match what the routes expect

-- Update users table to match route expectations
ALTER TABLE users 
  RENAME COLUMN password TO password_hash;

-- Add missing columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing admin users
UPDATE users 
SET role = 'admin' 
WHERE is_admin = true;

-- Drop the old is_admin column
ALTER TABLE users 
  DROP COLUMN IF EXISTS is_admin;

-- Update communities table to match route expectations
ALTER TABLE communities 
  RENAME COLUMN created_by TO creator_id;

-- Add missing columns to communities table
ALTER TABLE communities 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update community_members table to match route expectations
ALTER TABLE community_members 
  ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_communities_updated_at ON communities;
CREATE TRIGGER update_communities_updated_at 
    BEFORE UPDATE ON communities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_communities_creator_id ON communities(creator_id);
CREATE INDEX IF NOT EXISTS idx_community_members_role ON community_members(role);

-- Update any existing data to have proper defaults
UPDATE users SET role = 'user' WHERE role IS NULL;
UPDATE users SET is_active = true WHERE is_active IS NULL;
UPDATE community_members SET role = 'member' WHERE role IS NULL;
