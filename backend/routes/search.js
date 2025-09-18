const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Search users
router.get('/users', authenticateToken, (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
  }

  const searchTerm = `%${q.trim()}%`;

  const query = `
    SELECT 
      id, username, full_name, bio, location, field, avatar_url, is_verified, created_at
    FROM users 
    WHERE 
      username ILIKE $1 OR 
      full_name ILIKE $1 OR 
      bio ILIKE $1 OR 
      location ILIKE $1 OR 
      field ILIKE $1
    ORDER BY 
      CASE 
        WHEN username ILIKE $1 THEN 1
        WHEN full_name ILIKE $1 THEN 2
        ELSE 3
      END,
      created_at DESC
    LIMIT 50
  `;

  db.query(query, [searchTerm], (err, result) => {
    if (err) {
      console.error('Error searching users:', err);
      return res.status(500).json({ error: 'Failed to search users' });
    }

    res.json({ users: result.rows });
  });
});

// Search posts
router.get('/posts', authenticateToken, (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
  }

  const searchTerm = `%${q.trim()}%`;

  const query = `
    SELECT 
      p.id, p.title, p.content, p.image_url, p.created_at, p.updated_at,
      u.username as author_username, u.full_name as author_name, u.avatar_url as author_avatar,
      c.name as community_name, c.id as community_id
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN communities c ON p.community_id = c.id
    WHERE 
      p.title ILIKE $1 OR 
      p.content ILIKE $1
    ORDER BY p.created_at DESC
    LIMIT 50
  `;

  db.query(query, [searchTerm], (err, result) => {
    if (err) {
      console.error('Error searching posts:', err);
      return res.status(500).json({ error: 'Failed to search posts' });
    }

    res.json({ posts: result.rows });
  });
});

// Search communities
router.get('/communities', authenticateToken, (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
  }

  const searchTerm = `%${q.trim()}%`;

  const query = `
    SELECT 
      c.id, c.name, c.description, c.category, c.is_public, c.created_at,
      u.username as created_by_username, u.full_name as created_by_name,
      COUNT(cm.user_id) as member_count
    FROM communities c
    LEFT JOIN users u ON c.created_by = u.id
    LEFT JOIN community_members cm ON c.id = cm.community_id
    WHERE 
      c.name ILIKE $1 OR 
      c.description ILIKE $1 OR 
      c.category ILIKE $1
    GROUP BY c.id, u.username, u.full_name
    ORDER BY 
      CASE 
        WHEN c.name ILIKE $1 THEN 1
        WHEN c.description ILIKE $1 THEN 2
        ELSE 3
      END,
      member_count DESC
    LIMIT 50
  `;

  db.query(query, [searchTerm], (err, result) => {
    if (err) {
      console.error('Error searching communities:', err);
      return res.status(500).json({ error: 'Failed to search communities' });
    }

    res.json({ communities: result.rows });
  });
});

// Search opportunities
router.get('/opportunities', authenticateToken, (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
  }

  const searchTerm = `%${q.trim()}%`;

  const query = `
    SELECT 
      o.id, o.title, o.description, o.category, o.location, o.field,
      o.image_url, o.deadline, o.requirements, o.contact_info,
      o.application_url, o.is_external_application, o.created_at, o.updated_at,
      u.username as created_by_username, u.full_name as created_by_name
    FROM opportunities o
    LEFT JOIN users u ON o.created_by = u.id
    WHERE 
      o.title ILIKE $1 OR 
      o.description ILIKE $1 OR 
      o.category ILIKE $1 OR 
      o.location ILIKE $1 OR 
      o.field ILIKE $1
    ORDER BY 
      CASE 
        WHEN o.title ILIKE $1 THEN 1
        WHEN o.description ILIKE $1 THEN 2
        ELSE 3
      END,
      o.created_at DESC
    LIMIT 50
  `;

  db.query(query, [searchTerm], (err, result) => {
    if (err) {
      console.error('Error searching opportunities:', err);
      return res.status(500).json({ error: 'Failed to search opportunities' });
    }

    res.json({ opportunities: result.rows });
  });
});

// Search all (combined results)
router.get('/all', authenticateToken, (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
  }

  const searchTerm = `%${q.trim()}%`;

  // Execute all searches in parallel
  const searchPromises = [
    // Search users
    new Promise((resolve, reject) => {
      const userQuery = `
        SELECT 
          'user' as type, id, username, full_name, bio, location, field, avatar_url, is_verified, created_at
        FROM users 
        WHERE 
          username ILIKE $1 OR 
          full_name ILIKE $1 OR 
          bio ILIKE $1 OR 
          location ILIKE $1 OR 
          field ILIKE $1
        ORDER BY created_at DESC
        LIMIT 10
      `;
      db.query(userQuery, [searchTerm], (err, result) => {
        if (err) reject(err);
        else resolve({ users: result.rows });
      });
    }),

    // Search posts
    new Promise((resolve, reject) => {
      const postQuery = `
        SELECT 
          'post' as type, p.id, p.title, p.content, p.image_url, p.created_at, p.updated_at,
          u.username as author_username, u.full_name as author_name, u.avatar_url as author_avatar,
          c.name as community_name, c.id as community_id
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN communities c ON p.community_id = c.id
        WHERE 
          p.title ILIKE $1 OR 
          p.content ILIKE $1
        ORDER BY p.created_at DESC
        LIMIT 10
      `;
      db.query(postQuery, [searchTerm], (err, result) => {
        if (err) reject(err);
        else resolve({ posts: result.rows });
      });
    }),

    // Search communities
    new Promise((resolve, reject) => {
      const communityQuery = `
        SELECT 
          'community' as type, c.id, c.name, c.description, c.category, c.is_public, c.created_at,
          u.username as created_by_username, u.full_name as created_by_name,
          COUNT(cm.user_id) as member_count
        FROM communities c
        LEFT JOIN users u ON c.created_by = u.id
        LEFT JOIN community_members cm ON c.id = cm.community_id
        WHERE 
          c.name ILIKE $1 OR 
          c.description ILIKE $1 OR 
          c.category ILIKE $1
        GROUP BY c.id, u.username, u.full_name
        ORDER BY member_count DESC
        LIMIT 10
      `;
      db.query(communityQuery, [searchTerm], (err, result) => {
        if (err) reject(err);
        else resolve({ communities: result.rows });
      });
    }),

    // Search opportunities
    new Promise((resolve, reject) => {
      const opportunityQuery = `
        SELECT 
          'opportunity' as type, o.id, o.title, o.description, o.category, o.location, o.field,
          o.image_url, o.deadline, o.requirements, o.contact_info,
          o.application_url, o.is_external_application, o.created_at, o.updated_at,
          u.username as created_by_username, u.full_name as created_by_name
        FROM opportunities o
        LEFT JOIN users u ON o.created_by = u.id
        WHERE 
          o.title ILIKE $1 OR 
          o.description ILIKE $1 OR 
          o.category ILIKE $1 OR 
          o.location ILIKE $1 OR 
          o.field ILIKE $1
        ORDER BY o.created_at DESC
        LIMIT 10
      `;
      db.query(opportunityQuery, [searchTerm], (err, result) => {
        if (err) reject(err);
        else resolve({ opportunities: result.rows });
      });
    })
  ];

  Promise.all(searchPromises)
    .then((results) => {
      const combinedResults = {
        users: results[0].users,
        posts: results[1].posts,
        communities: results[2].communities,
        opportunities: results[3].opportunities,
        total_results: results[0].users.length + results[1].posts.length + 
                      results[2].communities.length + results[3].opportunities.length
      };

      res.json(combinedResults);
    })
    .catch((error) => {
      console.error('Error in combined search:', error);
      res.status(500).json({ error: 'Failed to perform search' });
    });
});

module.exports = router;
