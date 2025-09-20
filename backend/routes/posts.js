const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Create platform post (not community-specific)
router.post('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { title, content, image } = req.body;

  // Validate required fields
  if (!title || !content) {
    return sendErrorResponse(res, 400, 'Title and content are required');
  }

  const query = `
    INSERT INTO posts (title, content, author_id, image_url, is_published, created_at, updated_at)
    VALUES ($1, $2, $3, $4, true, NOW(), NOW())
    RETURNING id, title, content, image_url, created_at, updated_at
  `;

  const values = [title, content, userId, image || null];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error creating post:', err);
      return sendErrorResponse(res, 500, 'Failed to create post');
    }

    res.status(201).json({
      message: 'Post created successfully',
      post: result.rows[0]
    });
  });
});

// Get all platform posts
router.get('/', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      p.id, p.title, p.content, p.image_url, p.likes_count, p.comments_count,
      p.created_at, p.updated_at, p.author_id,
      u.username as author_username, u.full_name as author_name, u.avatar_url as author_avatar
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.community_id IS NULL AND p.is_published = true
    ORDER BY p.created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const countQuery = `
    SELECT COUNT(*) as total 
    FROM posts 
    WHERE community_id IS NULL AND is_published = true
  `;

  // Get total count
  db.query(countQuery, [], (err, countResult) => {
    if (err) {
      console.error('Error counting posts:', err);
      return sendErrorResponse(res, 500, 'Failed to count posts');
    }

    const total = parseInt(countResult.rows[0].total);

    // Get posts
    db.query(query, [parseInt(limit), offset], (err, result) => {
      if (err) {
        console.error('Error fetching posts:', err);
        return sendErrorResponse(res, 500, 'Failed to fetch posts');
      }

      res.json({
        posts: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    });
  });
});

// Get post by ID
router.get('/:id', (req, res) => {
  const postId = req.params.id;

  const query = `
    SELECT 
      p.id, p.title, p.content, p.image_url, p.likes_count, p.comments_count,
      p.created_at, p.updated_at, p.author_id,
      u.username as author_username, u.full_name as author_name, u.avatar_url as author_avatar
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.id = $1 AND p.is_published = true
  `;

  db.query(query, [postId], (err, result) => {
    if (err) {
      console.error('Error fetching post:', err);
      return sendErrorResponse(res, 500, 'Failed to fetch post');
    }

    if (result.rows.length === 0) {
      return sendErrorResponse(res, 404, 'Post not found');
    }

    res.json(result.rows[0]);
  });
});

// Update post
router.put('/:id', authenticateToken, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  const { title, content, image_url } = req.body;

  // First check if the post exists and belongs to the user
  const checkQuery = 'SELECT author_id FROM posts WHERE id = $1';
  db.query(checkQuery, [postId], (err, result) => {
    if (err) {
      console.error('Error checking post ownership:', err);
      return sendErrorResponse(res, 500, 'Failed to verify post ownership');
    }

    if (result.rows.length === 0) {
      return sendErrorResponse(res, 404, 'Post not found');
    }

    if (result.rows[0].author_id !== userId) {
      return sendErrorResponse(res, 403, 'You can only update your own posts');
    }

    // Build update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (title) {
      updateFields.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (content) {
      updateFields.push(`content = $${paramCount++}`);
      values.push(content);
    }
    if (image_url !== undefined) {
      updateFields.push(`image_url = $${paramCount++}`);
      values.push(image_url);
    }

    if (updateFields.length === 0) {
      return sendErrorResponse(res, 400, 'No fields to update');
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(postId);

    const updateQuery = `
      UPDATE posts 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, title, content, image_url, created_at, updated_at
    `;

    db.query(updateQuery, values, (err, result) => {
      if (err) {
        console.error('Error updating post:', err);
        return sendErrorResponse(res, 500, 'Failed to update post');
      }

      res.json({
        message: 'Post updated successfully',
        post: result.rows[0]
      });
    });
  });
});

// Delete post
router.delete('/:id', authenticateToken, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  // First check if the post exists and belongs to the user
  const checkQuery = 'SELECT author_id FROM posts WHERE id = $1';
  db.query(checkQuery, [postId], (err, result) => {
    if (err) {
      console.error('Error checking post ownership:', err);
      return sendErrorResponse(res, 500, 'Failed to verify post ownership');
    }

    if (result.rows.length === 0) {
      return sendErrorResponse(res, 404, 'Post not found');
    }

    if (result.rows[0].author_id !== userId) {
      return sendErrorResponse(res, 403, 'You can only delete your own posts');
    }

    // Delete the post
    const deleteQuery = 'DELETE FROM posts WHERE id = $1';
    db.query(deleteQuery, [postId], (err, result) => {
      if (err) {
        console.error('Error deleting post:', err);
        return sendErrorResponse(res, 500, 'Failed to delete post');
      }

      res.json({ message: 'Post deleted successfully' });
    });
  });
});

// Like/unlike post
router.post('/:id/like', authenticateToken, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  // Check if already liked
  const checkLikeQuery = 'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2';
  db.query(checkLikeQuery, [userId, postId], (err, result) => {
    if (err) {
      console.error('Error checking like status:', err);
      return sendErrorResponse(res, 500, 'Failed to check like status');
    }

    if (result.rows.length > 0) {
      // Unlike the post
      const unlikeQuery = 'DELETE FROM likes WHERE user_id = $1 AND post_id = $2';
      db.query(unlikeQuery, [userId, postId], (err) => {
        if (err) {
          console.error('Error unliking post:', err);
          return sendErrorResponse(res, 500, 'Failed to unlike post');
        }

        // Update likes count
        db.query('UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1', [postId], (err) => {
          if (err) {
            console.error('Error updating likes count:', err);
          }
        });

        res.json({ message: 'Post unliked successfully', liked: false });
      });
    } else {
      // Like the post
      const likeQuery = 'INSERT INTO likes (user_id, post_id, created_at) VALUES ($1, $2, NOW())';
      db.query(likeQuery, [userId, postId], (err) => {
        if (err) {
          console.error('Error liking post:', err);
          return sendErrorResponse(res, 500, 'Failed to like post');
        }

        // Update likes count
        db.query('UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1', [postId], (err) => {
          if (err) {
            console.error('Error updating likes count:', err);
          }
        });

        res.json({ message: 'Post liked successfully', liked: true });
      });
    }
  });
});

// Get post comments
router.get('/:id/comments', (req, res) => {
  const postId = req.params.id;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      c.id, c.content, c.created_at, c.updated_at,
      u.username as author_username, u.full_name as author_name, u.avatar_url as author_avatar
    FROM comments c
    LEFT JOIN users u ON c.author_id = u.id
    WHERE c.post_id = $1
    ORDER BY c.created_at ASC
    LIMIT $2 OFFSET $3
  `;

  db.query(query, [postId, parseInt(limit), offset], (err, result) => {
    if (err) {
      console.error('Error fetching comments:', err);
      return sendErrorResponse(res, 500, 'Failed to fetch comments');
    }

    res.json({ comments: result.rows });
  });
});

// Add comment to post
router.post('/:id/comments', authenticateToken, (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  const { content } = req.body;

  if (!content) {
    return sendErrorResponse(res, 400, 'Comment content is required');
  }

  const query = `
    INSERT INTO comments (content, author_id, post_id, created_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    RETURNING id, content, created_at, updated_at
  `;

  db.query(query, [content, userId, postId], (err, result) => {
    if (err) {
      console.error('Error creating comment:', err);
      return sendErrorResponse(res, 500, 'Failed to create comment');
    }

    // Update comments count
    db.query('UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1', [postId], (err) => {
      if (err) {
        console.error('Error updating comments count:', err);
      }
    });

    res.status(201).json({
      message: 'Comment created successfully',
      comment: result.rows[0]
    });
  });
});

module.exports = router;
