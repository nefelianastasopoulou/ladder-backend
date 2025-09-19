const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      id, username, email, full_name, bio, location, field, avatar_url,
      is_verified, role, created_at, updated_at
    FROM users
  `;
  let countQuery = 'SELECT COUNT(*) as total FROM users';
  const values = [];
  let paramCount = 1;

  if (search) {
    const searchTerm = `%${search}%`;
    query += ` WHERE username ILIKE $${paramCount} OR email ILIKE $${paramCount} OR full_name ILIKE $${paramCount}`;
    countQuery += ` WHERE username ILIKE $1 OR email ILIKE $1 OR full_name ILIKE $1`;
    values.push(searchTerm);
    paramCount++;
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  values.push(parseInt(limit), offset);

  // Get total count
  db.query(countQuery, search ? [search] : [], (err, countResult) => {
    if (err) {
      console.error('Error counting users:', err);
      return res.status(500).json({ error: 'Failed to count users' });
    }

    const total = parseInt(countResult.rows[0].total);

    // Get users
    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: 'Failed to fetch users' });
      }

      res.json({
        users: result.rows,
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

// Get all communities (admin only)
router.get('/communities', authenticateToken, requireAdmin, (req, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      c.id, c.name, c.description, c.category, c.is_public, c.created_at, c.updated_at,
      u.username as created_by_username, u.full_name as created_by_name,
      COUNT(cm.user_id) as member_count
    FROM communities c
    LEFT JOIN users u ON c.created_by = u.id
    LEFT JOIN community_members cm ON c.id = cm.community_id
  `;
  let countQuery = 'SELECT COUNT(*) as total FROM communities';
  const values = [];
  let paramCount = 1;

  if (search) {
    const searchTerm = `%${search}%`;
    query += ` WHERE c.name ILIKE $${paramCount} OR c.description ILIKE $${paramCount}`;
    countQuery += ` WHERE name ILIKE $1 OR description ILIKE $1`;
    values.push(searchTerm);
    paramCount++;
  }

  query += ` GROUP BY c.id, u.username, u.full_name ORDER BY c.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  values.push(parseInt(limit), offset);

  // Get total count
  db.query(countQuery, search ? [search] : [], (err, countResult) => {
    if (err) {
      console.error('Error counting communities:', err);
      return res.status(500).json({ error: 'Failed to count communities' });
    }

    const total = parseInt(countResult.rows[0].total);

    // Get communities
    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error fetching communities:', err);
        return res.status(500).json({ error: 'Failed to fetch communities' });
      }

      res.json({
        communities: result.rows,
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

// Get all posts (admin only)
router.get('/posts', authenticateToken, requireAdmin, (req, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      p.id, p.title, p.content, p.image_url, p.created_at, p.updated_at,
      u.username as author_username, u.full_name as author_name,
      c.name as community_name, c.id as community_id
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN communities c ON p.community_id = c.id
  `;
  let countQuery = 'SELECT COUNT(*) as total FROM posts';
  const values = [];
  let paramCount = 1;

  if (search) {
    const searchTerm = `%${search}%`;
    query += ` WHERE p.title ILIKE $${paramCount} OR p.content ILIKE $${paramCount}`;
    countQuery += ` WHERE title ILIKE $1 OR content ILIKE $1`;
    values.push(searchTerm);
    paramCount++;
  }

  query += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  values.push(parseInt(limit), offset);

  // Get total count
  db.query(countQuery, search ? [search] : [], (err, countResult) => {
    if (err) {
      console.error('Error counting posts:', err);
      return res.status(500).json({ error: 'Failed to count posts' });
    }

    const total = parseInt(countResult.rows[0].total);

    // Get posts
    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error fetching posts:', err);
        return res.status(500).json({ error: 'Failed to fetch posts' });
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

// Make user admin
router.post('/users/:userId/make-admin', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.userId;

  const query = `
    UPDATE users 
    SET role = 'admin', updated_at = NOW()
    WHERE id = $1
    RETURNING id, username, email, role
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error making user admin:', err);
      return res.status(500).json({ error: 'Failed to make user admin' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User promoted to admin successfully',
      user: result.rows[0]
    });
  });
});

// Remove admin status
router.post('/users/:userId/remove-admin', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.userId;
  const currentUserId = req.user.id;

  // Prevent removing admin status from self
  if (userId == currentUserId) {
    return res.status(400).json({ error: 'Cannot remove admin status from yourself' });
  }

  const query = `
    UPDATE users 
    SET role = 'user', updated_at = NOW()
    WHERE id = $1
    RETURNING id, username, email, role
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error removing admin status:', err);
      return res.status(500).json({ error: 'Failed to remove admin status' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Admin status removed successfully',
      user: result.rows[0]
    });
  });
});

// Delete user
router.delete('/users/:userId', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.userId;
  const currentUserId = req.user.id;

  // Prevent deleting self
  if (userId == currentUserId) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  const query = 'DELETE FROM users WHERE id = $1';
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  });
});

// Delete community
router.delete('/communities/:communityId', authenticateToken, requireAdmin, (req, res) => {
  const communityId = req.params.communityId;

  const query = 'DELETE FROM communities WHERE id = $1';
  db.query(query, [communityId], (err, result) => {
    if (err) {
      console.error('Error deleting community:', err);
      return res.status(500).json({ error: 'Failed to delete community' });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Community not found' });
    }

    res.json({ message: 'Community deleted successfully' });
  });
});

// Get post by ID (admin)
router.get('/posts/:postId', authenticateToken, requireAdmin, (req, res) => {
  const postId = req.params.postId;

  const query = `
    SELECT 
      p.id, p.title, p.content, p.image_url, p.likes_count, p.comments_count,
      p.created_at, p.updated_at, p.is_published,
      u.username as author_username, u.full_name as author_name, u.avatar_url as author_avatar,
      c.name as community_name, c.id as community_id
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN communities c ON p.community_id = c.id
    WHERE p.id = $1
  `;

  db.query(query, [postId], (err, result) => {
    if (err) {
      console.error('Error fetching post:', err);
      return res.status(500).json({ error: 'Failed to fetch post' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(result.rows[0]);
  });
});

// Update post (admin)
router.put('/posts/:postId', authenticateToken, requireAdmin, (req, res) => {
  const postId = req.params.postId;
  const { title, content, image_url, is_published } = req.body;

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
  if (is_published !== undefined) {
    updateFields.push(`is_published = $${paramCount++}`);
    values.push(is_published);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updateFields.push(`updated_at = NOW()`);
  values.push(postId);

  const updateQuery = `
    UPDATE posts 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING id, title, content, image_url, is_published, created_at, updated_at
  `;

  db.query(updateQuery, values, (err, result) => {
    if (err) {
      console.error('Error updating post:', err);
      return res.status(500).json({ error: 'Failed to update post' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      message: 'Post updated successfully',
      post: result.rows[0]
    });
  });
});

// Delete post
router.delete('/posts/:postId', authenticateToken, requireAdmin, (req, res) => {
  const postId = req.params.postId;

  const query = 'DELETE FROM posts WHERE id = $1';
  db.query(query, [postId], (err, result) => {
    if (err) {
      console.error('Error deleting post:', err);
      return res.status(500).json({ error: 'Failed to delete post' });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ message: 'Post deleted successfully' });
  });
});

// Get all posts (admin)
router.get('/posts', authenticateToken, requireAdmin, (req, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      p.id, p.title, p.content, p.image_url, p.likes_count, p.comments_count,
      p.created_at, p.updated_at, p.is_published,
      u.username as author_username, u.full_name as author_name, u.avatar_url as author_avatar,
      c.name as community_name, c.id as community_id
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN communities c ON p.community_id = c.id
  `;
  let countQuery = 'SELECT COUNT(*) as total FROM posts';
  const values = [];
  let paramCount = 1;

  if (search) {
    const searchTerm = `%${search}%`;
    query += ` WHERE (p.title ILIKE $${paramCount} OR p.content ILIKE $${paramCount})`;
    countQuery += ` WHERE (title ILIKE $1 OR content ILIKE $1)`;
    values.push(searchTerm);
    paramCount++;
  }

  query += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  values.push(parseInt(limit), offset);

  // Get total count
  db.query(countQuery, search ? [search] : [], (err, countResult) => {
    if (err) {
      console.error('Error counting posts:', err);
      return res.status(500).json({ error: 'Failed to count posts' });
    }

    const total = parseInt(countResult.rows[0].total);

    // Get posts
    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error fetching posts:', err);
        return res.status(500).json({ error: 'Failed to fetch posts' });
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

// Get reports
router.get('/reports', authenticateToken, requireAdmin, (req, res) => {
  const { page = 1, limit = 50, status } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      r.id, r.reported_type, r.reported_id, r.reason, r.description,
      r.status, r.created_at, r.updated_at,
      u.username as reporter_username, u.full_name as reporter_name
    FROM reports r
    LEFT JOIN users u ON r.reporter_id = u.id
  `;
  let countQuery = 'SELECT COUNT(*) as total FROM reports';
  const values = [];
  let paramCount = 1;

  if (status) {
    query += ` WHERE r.status = $${paramCount}`;
    countQuery += ` WHERE status = $1`;
    values.push(status);
    paramCount++;
  }

  query += ` ORDER BY r.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  values.push(parseInt(limit), offset);

  // Get total count
  db.query(countQuery, status ? [status] : [], (err, countResult) => {
    if (err) {
      console.error('Error counting reports:', err);
      return res.status(500).json({ error: 'Failed to count reports' });
    }

    const total = parseInt(countResult.rows[0].total);

    // Get reports
    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error fetching reports:', err);
        return res.status(500).json({ error: 'Failed to fetch reports' });
      }

      res.json({
        reports: result.rows,
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

// Get report by ID (admin)
router.get('/reports/:reportId', authenticateToken, requireAdmin, (req, res) => {
  const reportId = req.params.reportId;

  const query = `
    SELECT 
      r.id, r.reported_type, r.reported_id, r.reason, r.description,
      r.status, r.created_at, r.updated_at,
      u.username as reporter_username, u.full_name as reporter_name
    FROM reports r
    LEFT JOIN users u ON r.reporter_id = u.id
    WHERE r.id = $1
  `;

  db.query(query, [reportId], (err, result) => {
    if (err) {
      console.error('Error fetching report:', err);
      return res.status(500).json({ error: 'Failed to fetch report' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result.rows[0]);
  });
});

// Update report status
router.put('/reports/:reportId', authenticateToken, requireAdmin, (req, res) => {
  const reportId = req.params.reportId;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
    });
  }

  const query = `
    UPDATE reports 
    SET status = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING id, reported_type, reported_id, reason, description, status, created_at, updated_at
  `;

  db.query(query, [reportId, status], (err, result) => {
    if (err) {
      console.error('Error updating report status:', err);
      return res.status(500).json({ error: 'Failed to update report status' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      message: 'Report status updated successfully',
      report: result.rows[0]
    });
  });
});

// Get system statistics
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  const statsQueries = [
    // User stats
    new Promise((resolve, reject) => {
      const userQuery = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
          COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_users,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
        FROM users
      `;
      db.query(userQuery, [], (err, result) => {
        if (err) reject(err);
        else resolve({ users: result.rows[0] });
      });
    }),

    // Community stats
    new Promise((resolve, reject) => {
      const communityQuery = `
        SELECT 
          COUNT(*) as total_communities,
          COUNT(CASE WHEN is_public = true THEN 1 END) as public_communities,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_communities_30d
        FROM communities
      `;
      db.query(communityQuery, [], (err, result) => {
        if (err) reject(err);
        else resolve({ communities: result.rows[0] });
      });
    }),

    // Post stats
    new Promise((resolve, reject) => {
      const postQuery = `
        SELECT 
          COUNT(*) as total_posts,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_posts_30d
        FROM posts
      `;
      db.query(postQuery, [], (err, result) => {
        if (err) reject(err);
        else resolve({ posts: result.rows[0] });
      });
    }),

    // Opportunity stats
    new Promise((resolve, reject) => {
      const opportunityQuery = `
        SELECT 
          COUNT(*) as total_opportunities,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_opportunities_30d
        FROM opportunities
      `;
      db.query(opportunityQuery, [], (err, result) => {
        if (err) reject(err);
        else resolve({ opportunities: result.rows[0] });
      });
    }),

    // Report stats
    new Promise((resolve, reject) => {
      const reportQuery = `
        SELECT 
          COUNT(*) as total_reports,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_reports_30d
        FROM reports
      `;
      db.query(reportQuery, [], (err, result) => {
        if (err) reject(err);
        else resolve({ reports: result.rows[0] });
      });
    })
  ];

  Promise.all(statsQueries)
    .then((results) => {
      const stats = {
        users: results[0].users,
        communities: results[1].communities,
        posts: results[2].posts,
        opportunities: results[3].opportunities,
        reports: results[4].reports,
        generated_at: new Date().toISOString()
      };

      res.json(stats);
    })
    .catch((error) => {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ error: 'Failed to fetch admin statistics' });
    });
});

module.exports = router;
