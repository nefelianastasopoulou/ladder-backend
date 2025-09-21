-- Fix conversations table schema to match backend expectations
-- The backend expects user1_id and user2_id columns for individual conversations

-- First, let's check if the conversations table has the right structure
-- If it doesn't have user1_id and user2_id, we need to add them

-- Add user1_id and user2_id columns if they don't exist
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Update existing conversations to have user1_id and user2_id
-- For existing individual conversations, we'll need to populate these from conversation_participants
UPDATE conversations 
SET user1_id = (
  SELECT user_id 
  FROM conversation_participants 
  WHERE conversation_id = conversations.id 
  ORDER BY joined_at ASC 
  LIMIT 1
),
user2_id = (
  SELECT user_id 
  FROM conversation_participants 
  WHERE conversation_id = conversations.id 
  ORDER BY joined_at ASC 
  OFFSET 1 
  LIMIT 1
)
WHERE type = 'individual' 
AND user1_id IS NULL 
AND user2_id IS NULL;

-- Add constraints to ensure individual conversations have exactly 2 users
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_individual_conversation_users'
    ) THEN
        ALTER TABLE conversations 
        ADD CONSTRAINT check_individual_conversation_users 
        CHECK (
          (type = 'individual' AND user1_id IS NOT NULL AND user2_id IS NOT NULL AND user1_id != user2_id) OR
          (type != 'individual')
        );
    END IF;
END $$;

-- Update messages table to use author_id instead of sender_id to match backend
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'sender_id'
    ) THEN
        ALTER TABLE messages RENAME COLUMN sender_id TO author_id;
    END IF;
END $$;

-- Add updated_at column to messages if it doesn't exist
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Add trigger to update updated_at timestamp on messages
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_messages_updated_at_trigger ON messages;
CREATE TRIGGER update_messages_updated_at_trigger 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_messages_updated_at();
