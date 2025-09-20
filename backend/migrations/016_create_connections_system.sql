-- Create connections system for privacy settings
-- This migration creates the user_connections table to track who can see "connections only" content

-- Create user_connections table
CREATE TABLE IF NOT EXISTS user_connections (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'blocked'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, addressee_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_connections_requester ON user_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_addressee ON user_connections(addressee_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON user_connections(status);

-- Add constraint for valid status values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_connection_status_valid'
    ) THEN
        ALTER TABLE user_connections 
        ADD CONSTRAINT check_connection_status_valid 
        CHECK (status IN ('pending', 'accepted', 'declined', 'blocked'));
    END IF;
END $$;

-- Prevent self-connections
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_no_self_connection'
    ) THEN
        ALTER TABLE user_connections 
        ADD CONSTRAINT check_no_self_connection 
        CHECK (requester_id != addressee_id);
    END IF;
END $$;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_connection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_connections_updated_at'
    ) THEN
        CREATE TRIGGER update_user_connections_updated_at
            BEFORE UPDATE ON user_connections
            FOR EACH ROW
            EXECUTE FUNCTION update_connection_updated_at();
    END IF;
END $$;
