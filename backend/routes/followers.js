const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Get user's followers (people who follow the current user)
router.get('/followers', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      uf.id,
      uf.created_at,
      u.id as user_id,
      u.username,
      u.full_name,
      u.avatar_url
    FROM user_follows uf
    JOIN users u ON uf.follower_id = u.id
    WHERE uf.following_id = $1
    ORDER BY uf.created_at DESC
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching followers:', err);
      return res.status(500).json({ error: 'Failed to fetch followers' });
    }

    res.json({ followers: result.rows });
  });
});

// Get user's following (people the current user follows)
router.get('/following', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      uf.id,
      uf.created_at,
      u.id as user_id,
      u.username,
      u.full_name,
      u.avatar_url
    FROM user_follows uf
    JOIN users u ON uf.following_id = u.id
    WHERE uf.follower_id = $1
    ORDER BY uf.created_at DESC
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching following:', err);
      return res.status(500).json({ error: 'Failed to fetch following' });
    }

    res.json({ following: result.rows });
  });
});

// Follow a user
router.post('/follow', authenticateToken, (req, res) => {
  const followerId = req.user.id;
  const { following_id } = req.body;

  if (!following_id) {
    return res.status(400).json({ error: 'following_id is required' });
  }

  if (followerId === following_id) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  // Check if already following
  const checkQuery = `
    SELECT id FROM user_follows 
    WHERE follower_id = $1 AND following_id = $2
  `;

  db.query(checkQuery, [followerId, following_id], (err, result) => {
    if (err) {
      console.error('Error checking existing follow:', err);
      return res.status(500).json({ error: 'Failed to check existing follow' });
    }

    if (result.rows.length > 0) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Create new follow relationship
    const insertQuery = `
      INSERT INTO user_follows (follower_id, following_id)
      VALUES ($1, $2)
      RETURNING id, created_at
    `;

    db.query(insertQuery, [followerId, following_id], (err, result) => {
      if (err) {
        console.error('Error creating follow relationship:', err);
        return res.status(500).json({ error: 'Failed to follow user' });
      }

      res.json({
        message: 'Successfully followed user',
        follow: result.rows[0]
      });
    });
  });
});

// Unfollow a user
router.delete('/unfollow', authenticateToken, (req, res) => {
  const followerId = req.user.id;
  const { following_id } = req.body;

  if (!following_id) {
    return res.status(400).json({ error: 'following_id is required' });
  }

  const query = `
    DELETE FROM user_follows 
    WHERE follower_id = $1 AND following_id = $2
    RETURNING id
  `;

  db.query(query, [followerId, following_id], (err, result) => {
    if (err) {
      console.error('Error unfollowing user:', err);
      return res.status(500).json({ error: 'Failed to unfollow user' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Follow relationship not found' });
    }

    res.json({ message: 'Successfully unfollowed user' });
  });
});

// Check if current user follows another user
router.get('/check/:userId', authenticateToken, (req, res) => {
  const followerId = req.user.id;
  const followingId = req.params.userId;

  const query = `
    SELECT id FROM user_follows 
    WHERE follower_id = $1 AND following_id = $2
  `;

  db.query(query, [followerId, followingId], (err, result) => {
    if (err) {
      console.error('Error checking follow status:', err);
      return res.status(500).json({ error: 'Failed to check follow status' });
    }

    res.json({ 
      following: result.rows.length > 0,
      followId: result.rows.length > 0 ? result.rows[0].id : null
    });
  });
});

// Get follow counts for a user
router.get('/counts/:userId', (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT 
      (SELECT COUNT(*) FROM user_follows WHERE following_id = $1) as followers_count,
      (SELECT COUNT(*) FROM user_follows WHERE follower_id = $1) as following_count
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching follow counts:', err);
      return res.status(500).json({ error: 'Failed to fetch follow counts' });
    }

    res.json(result.rows[0]);
  });
});

module.exports = router;
