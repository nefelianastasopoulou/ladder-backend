-- Add comment features: replies, likes, and delete functionality
-- This migration adds support for nested comments and comment likes

-- Add parent_comment_id to comments table for replies
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE;

-- Add likes_count to comments table
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, comment_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);

-- Create trigger function for comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for comment likes count
DROP TRIGGER IF EXISTS update_comment_likes_count_trigger ON comment_likes;
CREATE TRIGGER update_comment_likes_count_trigger 
    AFTER INSERT OR DELETE ON comment_likes 
    FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Update existing comments to have correct likes_count
UPDATE comments 
SET likes_count = (
  SELECT COUNT(*) 
  FROM comment_likes 
  WHERE comment_likes.comment_id = comments.id
);
