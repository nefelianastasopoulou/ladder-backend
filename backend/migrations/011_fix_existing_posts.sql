-- Fix existing posts that don't have is_published set
-- This migration sets is_published = true for all existing posts

UPDATE posts 
SET is_published = true 
WHERE is_published IS NULL;

-- Verify the update
SELECT COUNT(*) as updated_posts 
FROM posts 
WHERE is_published = true;
