const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Get user's favorites
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      f.id as favorite_id,
      f.created_at as favorited_at,
      o.id, o.title, o.description, o.category, o.location, o.field,
      o.image_url, o.deadline, o.requirements, o.contact_info,
      o.application_url, o.is_external_application, o.created_at, o.updated_at,
      u.username as created_by_username, u.full_name as created_by_name
    FROM favorites f
    JOIN opportunities o ON f.opportunity_id = o.id
    LEFT JOIN users u ON o.created_by = u.id
    WHERE f.user_id = $1
    ORDER BY f.created_at DESC
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching favorites:', err);
      return res.status(500).json({ error: 'Failed to fetch favorites' });
    }

    res.json(result.rows);
  });
});

// Add opportunity to favorites
router.post('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { opportunity_id } = req.body;

  if (!opportunity_id) {
    return res.status(400).json({ error: 'opportunity_id is required' });
  }

  // Check if opportunity exists
  const checkOpportunityQuery = 'SELECT id FROM opportunities WHERE id = $1';
  db.query(checkOpportunityQuery, [opportunity_id], (err, result) => {
    if (err) {
      console.error('Error checking opportunity:', err);
      return res.status(500).json({ error: 'Failed to verify opportunity' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Check if already favorited
    const checkFavoriteQuery = 'SELECT id FROM favorites WHERE user_id = $1 AND opportunity_id = $2';
    db.query(checkFavoriteQuery, [userId, opportunity_id], (err, result) => {
      if (err) {
        console.error('Error checking existing favorite:', err);
        return res.status(500).json({ error: 'Failed to check existing favorite' });
      }

      if (result.rows.length > 0) {
        return res.status(409).json({ error: 'Opportunity is already in favorites' });
      }

      // Add to favorites
      const insertQuery = `
        INSERT INTO favorites (user_id, opportunity_id, created_at)
        VALUES ($1, $2, NOW())
        RETURNING id, created_at
      `;

      db.query(insertQuery, [userId, opportunity_id], (err, result) => {
        if (err) {
          console.error('Error adding to favorites:', err);
          return res.status(500).json({ error: 'Failed to add to favorites' });
        }

        res.status(201).json({
          message: 'Opportunity added to favorites',
          favorite: result.rows[0]
        });
      });
    });
  });
});

// Remove opportunity from favorites
router.delete('/:opportunityId', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const opportunityId = req.params.opportunityId;

  const query = 'DELETE FROM favorites WHERE user_id = $1 AND opportunity_id = $2';
  db.query(query, [userId, opportunityId], (err, result) => {
    if (err) {
      console.error('Error removing from favorites:', err);
      return res.status(500).json({ error: 'Failed to remove from favorites' });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Opportunity removed from favorites' });
  });
});

// Check if opportunity is favorited
router.get('/check/:opportunityId', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const opportunityId = req.params.opportunityId;

  const query = 'SELECT id FROM favorites WHERE user_id = $1 AND opportunity_id = $2';
  db.query(query, [userId, opportunityId], (err, result) => {
    if (err) {
      console.error('Error checking favorite status:', err);
      return res.status(500).json({ error: 'Failed to check favorite status' });
    }

    res.json({
      is_favorited: result.rows.length > 0
    });
  });
});

module.exports = router;
