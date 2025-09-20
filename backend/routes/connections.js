const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Get all connections for the current user
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      uc.id,
      uc.requester_id,
      uc.addressee_id,
      uc.status,
      uc.created_at,
      uc.updated_at,
      CASE 
        WHEN uc.requester_id = $1 THEN u2.id
        ELSE u1.id
      END as other_user_id,
      CASE 
        WHEN uc.requester_id = $1 THEN u2.username
        ELSE u1.username
      END as other_username,
      CASE 
        WHEN uc.requester_id = $1 THEN u2.full_name
        ELSE u1.full_name
      END as other_full_name,
      CASE 
        WHEN uc.requester_id = $1 THEN u2.avatar_url
        ELSE u1.avatar_url
      END as other_avatar_url,
      CASE 
        WHEN uc.requester_id = $1 THEN 'outgoing'
        ELSE 'incoming'
      END as direction
    FROM user_connections uc
    LEFT JOIN users u1 ON uc.requester_id = u1.id
    LEFT JOIN users u2 ON uc.addressee_id = u2.id
    WHERE (uc.requester_id = $1 OR uc.addressee_id = $1)
    AND uc.status = 'accepted'
    ORDER BY uc.updated_at DESC
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching connections:', err);
      return res.status(500).json({ error: 'Failed to fetch connections' });
    }

    res.json({ connections: result.rows });
  });
});

// Get pending connection requests (incoming)
router.get('/pending', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      uc.id,
      uc.requester_id,
      uc.created_at,
      u.username,
      u.full_name,
      u.avatar_url
    FROM user_connections uc
    JOIN users u ON uc.requester_id = u.id
    WHERE uc.addressee_id = $1 AND uc.status = 'pending'
    ORDER BY uc.created_at DESC
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching pending connections:', err);
      return res.status(500).json({ error: 'Failed to fetch pending connections' });
    }

    res.json({ pendingConnections: result.rows });
  });
});

// Send connection request
router.post('/request', authenticateToken, (req, res) => {
  const requesterId = req.user.id;
  const { addressee_id } = req.body;

  if (!addressee_id) {
    return res.status(400).json({ error: 'addressee_id is required' });
  }

  if (requesterId === addressee_id) {
    return res.status(400).json({ error: 'Cannot send connection request to yourself' });
  }

  // Check if connection already exists
  const checkQuery = `
    SELECT id, status FROM user_connections 
    WHERE (requester_id = $1 AND addressee_id = $2) 
    OR (requester_id = $2 AND addressee_id = $1)
  `;

  db.query(checkQuery, [requesterId, addressee_id], (err, result) => {
    if (err) {
      console.error('Error checking existing connection:', err);
      return res.status(500).json({ error: 'Failed to check existing connection' });
    }

    if (result.rows.length > 0) {
      const existing = result.rows[0];
      if (existing.status === 'accepted') {
        return res.status(400).json({ error: 'Already connected' });
      } else if (existing.status === 'pending') {
        return res.status(400).json({ error: 'Connection request already pending' });
      } else if (existing.status === 'blocked') {
        return res.status(400).json({ error: 'Connection blocked' });
      }
    }

    // Create new connection request
    const insertQuery = `
      INSERT INTO user_connections (requester_id, addressee_id, status)
      VALUES ($1, $2, 'pending')
      RETURNING id, status, created_at
    `;

    db.query(insertQuery, [requesterId, addressee_id], (err, result) => {
      if (err) {
        console.error('Error creating connection request:', err);
        return res.status(500).json({ error: 'Failed to send connection request' });
      }

      res.json({
        message: 'Connection request sent successfully',
        connection: result.rows[0]
      });
    });
  });
});

// Accept connection request
router.post('/accept/:connectionId', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const connectionId = req.params.connectionId;

  const query = `
    UPDATE user_connections 
    SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND addressee_id = $2 AND status = 'pending'
    RETURNING id, requester_id, addressee_id, status, updated_at
  `;

  db.query(query, [connectionId, userId], (err, result) => {
    if (err) {
      console.error('Error accepting connection:', err);
      return res.status(500).json({ error: 'Failed to accept connection' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Connection request not found or already processed' });
    }

    res.json({
      message: 'Connection accepted successfully',
      connection: result.rows[0]
    });
  });
});

// Decline connection request
router.post('/decline/:connectionId', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const connectionId = req.params.connectionId;

  const query = `
    UPDATE user_connections 
    SET status = 'declined', updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND addressee_id = $2 AND status = 'pending'
    RETURNING id, status, updated_at
  `;

  db.query(query, [connectionId, userId], (err, result) => {
    if (err) {
      console.error('Error declining connection:', err);
      return res.status(500).json({ error: 'Failed to decline connection' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Connection request not found or already processed' });
    }

    res.json({
      message: 'Connection declined successfully',
      connection: result.rows[0]
    });
  });
});

// Remove connection
router.delete('/:connectionId', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const connectionId = req.params.connectionId;

  const query = `
    DELETE FROM user_connections 
    WHERE id = $1 AND (requester_id = $2 OR addressee_id = $2)
    RETURNING id
  `;

  db.query(query, [connectionId, userId], (err, result) => {
    if (err) {
      console.error('Error removing connection:', err);
      return res.status(500).json({ error: 'Failed to remove connection' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    res.json({ message: 'Connection removed successfully' });
  });
});

// Check if two users are connected
router.get('/check/:otherUserId', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.otherUserId;

  const query = `
    SELECT status FROM user_connections 
    WHERE (requester_id = $1 AND addressee_id = $2) 
    OR (requester_id = $2 AND addressee_id = $1)
  `;

  db.query(query, [userId, otherUserId], (err, result) => {
    if (err) {
      console.error('Error checking connection status:', err);
      return res.status(500).json({ error: 'Failed to check connection status' });
    }

    if (result.rows.length === 0) {
      return res.json({ connected: false, status: null });
    }

    const status = result.rows[0].status;
    res.json({ 
      connected: status === 'accepted',
      status: status
    });
  });
});

module.exports = router;
