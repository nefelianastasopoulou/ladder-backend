-- Fix likes count synchronization
-- This migration ensures that the likes_count field in posts table
-- matches the actual number of likes in the likes table

-- Update all posts to have the correct likes_count
UPDATE posts 
SET likes_count = (
  SELECT COUNT(*) 
  FROM likes 
  WHERE likes.post_id = posts.id
);

-- Verify the fix by showing the results
SELECT 
  p.id, 
  p.title, 
  p.likes_count as stored_count,
  COUNT(l.id) as actual_likes,
  CASE 
    WHEN p.likes_count = COUNT(l.id) THEN 'SYNCED' 
    ELSE 'MISMATCH' 
  END as status
FROM posts p
LEFT JOIN likes l ON p.id = l.post_id
GROUP BY p.id, p.title, p.likes_count
ORDER BY p.id;
