-- Fix likes and comments count synchronization
-- This migration ensures that the likes_count and comments_count fields in posts table
-- match the actual number of likes and comments in their respective tables

-- Update all posts to have the correct likes_count
UPDATE posts 
SET likes_count = (
  SELECT COUNT(*) 
  FROM likes 
  WHERE likes.post_id = posts.id
);

-- Update all posts to have the correct comments_count
UPDATE posts 
SET comments_count = (
  SELECT COUNT(*) 
  FROM comments 
  WHERE comments.post_id = posts.id
);

-- Verify the fix by showing the results
SELECT 
  p.id, 
  p.title, 
  p.likes_count as stored_likes,
  COUNT(l.id) as actual_likes,
  p.comments_count as stored_comments,
  COUNT(c.id) as actual_comments,
  CASE 
    WHEN p.likes_count = COUNT(l.id) AND p.comments_count = COUNT(c.id) THEN 'SYNCED' 
    ELSE 'MISMATCH' 
  END as status
FROM posts p
LEFT JOIN likes l ON p.id = l.post_id
LEFT JOIN comments c ON p.id = c.post_id
GROUP BY p.id, p.title, p.likes_count, p.comments_count
ORDER BY p.id;
