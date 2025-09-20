const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const { filterContentByPrivacy } = require('../utils/privacy');

// Get user profile
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      id, username, email, full_name, bio, location, field, 
      avatar_url, created_at, updated_at, role, is_verified
    FROM users 
    WHERE id = $1
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching profile:', err);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    // Remove sensitive information
    delete user.email; // Don't expose email in profile

    res.json({
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        bio: user.bio,
        location: user.location,
        field: user.field,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        updated_at: user.updated_at,
        role: user.role,
        is_verified: user.is_verified
      }
    });
  });
});

// Update user profile
router.put('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { full_name, username, bio, location, field, avatar_url } = req.body;

  // Validate input
  if (!full_name && !username && !bio && !location && !field && !avatar_url) {
    return res.status(400).json({ error: 'At least one field must be provided for update' });
  }

  // Check if username is already taken (if username is being updated)
  if (username) {
    const checkUsernameQuery = 'SELECT id FROM users WHERE username = $1 AND id != $2';
    db.query(checkUsernameQuery, [username, userId], (err, result) => {
      if (err) {
        console.error('Error checking username:', err);
        return res.status(500).json({ error: 'Failed to check username availability' });
      }

      if (result.rows.length > 0) {
        return res.status(409).json({ error: 'Username is already taken' });
      }

      // Continue with update
      updateProfile();
    });
  } else {
    updateProfile();
  }

  function updateProfile() {
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (full_name) {
      updateFields.push(`full_name = $${paramCount++}`);
      values.push(full_name);
    }
    if (username) {
      updateFields.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (bio !== undefined) {
      updateFields.push(`bio = $${paramCount++}`);
      values.push(bio);
    }
    if (location) {
      updateFields.push(`location = $${paramCount++}`);
      values.push(location);
    }
    if (field) {
      updateFields.push(`field = $${paramCount++}`);
      values.push(field);
    }
    if (avatar_url) {
      updateFields.push(`avatar_url = $${paramCount++}`);
      values.push(avatar_url);
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, full_name, bio, location, field, avatar_url, created_at, updated_at, role, is_verified
    `;

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error updating profile:', err);
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];
      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          bio: user.bio,
          location: user.location,
          field: user.field,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          updated_at: user.updated_at,
          role: user.role,
          is_verified: user.is_verified
        }
      });
    });
  }
});

// Get user's own posts
router.get('/posts', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      p.id, p.title, p.content, p.created_at, p.updated_at,
      c.name as community_name, c.id as community_id
    FROM posts p
    LEFT JOIN communities c ON p.community_id = c.id
    WHERE p.author_id = $1
    ORDER BY p.created_at DESC
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching user posts:', err);
      return res.status(500).json({ error: 'Failed to fetch user posts' });
    }

    res.json(result.rows);
  });
});

// Get user profile by ID (public)
router.get('/:userId', (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT 
      id, username, full_name, bio, location, field, 
      avatar_url, created_at, role, is_verified
    FROM users 
    WHERE id = $1
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching user profile:', err);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({ user });
  });
});

// Get user's posts with privacy filtering
router.get('/:userId/posts', authenticateToken, async (req, res) => {
  const targetUserId = req.params.userId;
  const viewerId = req.user.id;

  try {
    const query = `
      SELECT 
        p.id, p.title, p.content, p.created_at, p.updated_at, p.image_url,
        p.likes_count, p.comments_count, p.author_id,
        c.name as community_name, c.id as community_id
      FROM posts p
      LEFT JOIN communities c ON p.community_id = c.id
      WHERE p.author_id = $1 AND p.is_published = true
      ORDER BY p.created_at DESC
    `;

    db.query(query, [targetUserId], async (err, result) => {
      if (err) {
        console.error('Error fetching user posts:', err);
        return res.status(500).json({ error: 'Failed to fetch user posts' });
      }

      // Filter posts based on privacy settings
      const filteredPosts = await filterContentByPrivacy(
        result.rows, 
        viewerId, 
        'community_posts_visibility'
      );

      res.json({ posts: filteredPosts });
    });
  } catch (error) {
    console.error('Error in privacy filtering:', error);
    res.status(500).json({ error: 'Failed to filter posts' });
  }
});

// Get user's opportunities with privacy filtering
router.get('/:userId/opportunities', authenticateToken, async (req, res) => {
  const targetUserId = req.params.userId;
  const viewerId = req.user.id;

  try {
    const query = `
      SELECT 
        o.id, o.title, o.description, o.category, o.location, o.field,
        o.created_at, o.updated_at, o.deadline, o.image_url,
        o.author_id
      FROM opportunities o
      WHERE o.author_id = $1
      ORDER BY o.created_at DESC
    `;

    db.query(query, [targetUserId], async (err, result) => {
      if (err) {
        console.error('Error fetching user opportunities:', err);
        return res.status(500).json({ error: 'Failed to fetch user opportunities' });
      }

      // Filter opportunities based on privacy settings
      const filteredOpportunities = await filterContentByPrivacy(
        result.rows, 
        viewerId, 
        'opportunities_on_profile_visibility'
      );

      res.json({ opportunities: filteredOpportunities });
    });
  } catch (error) {
    console.error('Error in privacy filtering:', error);
    res.status(500).json({ error: 'Failed to filter opportunities' });
  }
});

// Get user's applications with privacy filtering
router.get('/:userId/applications', authenticateToken, async (req, res) => {
  const targetUserId = req.params.userId;
  const viewerId = req.user.id;

  try {
    const query = `
      SELECT 
        a.id, a.status, a.notes, a.created_at, a.updated_at,
        o.title as opportunity_title, o.id as opportunity_id,
        a.user_id as author_id
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
    `;

    db.query(query, [targetUserId], async (err, result) => {
      if (err) {
        console.error('Error fetching user applications:', err);
        return res.status(500).json({ error: 'Failed to fetch user applications' });
      }

      // Filter applications based on privacy settings
      const filteredApplications = await filterContentByPrivacy(
        result.rows, 
        viewerId, 
        'applications_on_profile_visibility'
      );

      res.json({ applications: filteredApplications });
    });
  } catch (error) {
    console.error('Error in privacy filtering:', error);
    res.status(500).json({ error: 'Failed to filter applications' });
  }
});

module.exports = router;
