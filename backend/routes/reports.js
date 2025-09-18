const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Submit a report
router.post('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { reported_type, reported_id, reason, description } = req.body;

  // Validate required fields
  if (!reported_type || !reported_id || !reason) {
    return res.status(400).json({ 
      error: 'reported_type, reported_id, and reason are required' 
    });
  }

  // Validate reported_type
  const validTypes = ['user', 'community', 'post', 'opportunity'];
  if (!validTypes.includes(reported_type)) {
    return res.status(400).json({ 
      error: `Invalid reported_type. Must be one of: ${validTypes.join(', ')}` 
    });
  }

  // Validate reason
  const validReasons = [
    'spam', 'harassment', 'inappropriate_content', 'fake_information',
    'violence', 'hate_speech', 'copyright_violation', 'other'
  ];
  if (!validReasons.includes(reason)) {
    return res.status(400).json({ 
      error: `Invalid reason. Must be one of: ${validReasons.join(', ')}` 
    });
  }

  // Check if the reported item exists
  let checkQuery;
  switch (reported_type) {
    case 'user':
      checkQuery = 'SELECT id FROM users WHERE id = $1';
      break;
    case 'community':
      checkQuery = 'SELECT id FROM communities WHERE id = $1';
      break;
    case 'post':
      checkQuery = 'SELECT id FROM posts WHERE id = $1';
      break;
    case 'opportunity':
      checkQuery = 'SELECT id FROM opportunities WHERE id = $1';
      break;
  }

  db.query(checkQuery, [reported_id], (err, result) => {
    if (err) {
      console.error('Error checking reported item:', err);
      return res.status(500).json({ error: 'Failed to verify reported item' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `${reported_type} not found` });
    }

    // Check if user has already reported this item
    const checkExistingQuery = `
      SELECT id FROM reports 
      WHERE reporter_id = $1 AND reported_type = $2 AND reported_id = $3
    `;

    db.query(checkExistingQuery, [userId, reported_type, reported_id], (err, result) => {
      if (err) {
        console.error('Error checking existing report:', err);
        return res.status(500).json({ error: 'Failed to check existing report' });
      }

      if (result.rows.length > 0) {
        return res.status(409).json({ error: 'You have already reported this item' });
      }

      // Create the report
      const insertQuery = `
        INSERT INTO reports (
          reporter_id, reported_type, reported_id, reason, description, 
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
        RETURNING id, reported_type, reported_id, reason, description, 
                  status, created_at, updated_at
      `;

      const values = [userId, reported_type, reported_id, reason, description || null];

      db.query(insertQuery, values, (err, result) => {
        if (err) {
          console.error('Error creating report:', err);
          return res.status(500).json({ error: 'Failed to submit report' });
        }

        res.status(201).json({
          message: 'Report submitted successfully',
          report: result.rows[0]
        });
      });
    });
  });
});

// Get user's reports
router.get('/my', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      id, reported_type, reported_id, reason, description,
      status, created_at, updated_at
    FROM reports 
    WHERE reporter_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const countQuery = 'SELECT COUNT(*) as total FROM reports WHERE reporter_id = $1';

  // Get total count
  db.query(countQuery, [userId], (err, countResult) => {
    if (err) {
      console.error('Error counting user reports:', err);
      return res.status(500).json({ error: 'Failed to count reports' });
    }

    const total = parseInt(countResult.rows[0].total);

    // Get reports
    db.query(query, [userId, parseInt(limit), offset], (err, result) => {
      if (err) {
        console.error('Error fetching user reports:', err);
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

// Get report by ID (user can only see their own reports)
router.get('/:reportId', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const reportId = req.params.reportId;

  const query = `
    SELECT 
      id, reported_type, reported_id, reason, description,
      status, created_at, updated_at
    FROM reports 
    WHERE id = $1 AND reporter_id = $2
  `;

  db.query(query, [reportId, userId], (err, result) => {
    if (err) {
      console.error('Error fetching report:', err);
      return res.status(500).json({ error: 'Failed to fetch report' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ report: result.rows[0] });
  });
});

// Update report (user can only update their own pending reports)
router.put('/:reportId', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const reportId = req.params.reportId;
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'description is required' });
  }

  // Check if report exists and belongs to user
  const checkQuery = `
    SELECT id, status FROM reports 
    WHERE id = $1 AND reporter_id = $2
  `;

  db.query(checkQuery, [reportId, userId], (err, result) => {
    if (err) {
      console.error('Error checking report ownership:', err);
      return res.status(500).json({ error: 'Failed to verify report ownership' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (result.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Can only update pending reports' });
    }

    // Update the report
    const updateQuery = `
      UPDATE reports 
      SET description = $3, updated_at = NOW()
      WHERE id = $1 AND reporter_id = $2
      RETURNING id, reported_type, reported_id, reason, description,
                status, created_at, updated_at
    `;

    db.query(updateQuery, [reportId, userId, description], (err, result) => {
      if (err) {
        console.error('Error updating report:', err);
        return res.status(500).json({ error: 'Failed to update report' });
      }

      res.json({
        message: 'Report updated successfully',
        report: result.rows[0]
      });
    });
  });
});

// Delete report (user can only delete their own pending reports)
router.delete('/:reportId', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const reportId = req.params.reportId;

  // Check if report exists and belongs to user
  const checkQuery = `
    SELECT id, status FROM reports 
    WHERE id = $1 AND reporter_id = $2
  `;

  db.query(checkQuery, [reportId, userId], (err, result) => {
    if (err) {
      console.error('Error checking report ownership:', err);
      return res.status(500).json({ error: 'Failed to verify report ownership' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (result.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Can only delete pending reports' });
    }

    // Delete the report
    const deleteQuery = 'DELETE FROM reports WHERE id = $1 AND reporter_id = $2';
    db.query(deleteQuery, [reportId, userId], (err, result) => {
      if (err) {
        console.error('Error deleting report:', err);
        return res.status(500).json({ error: 'Failed to delete report' });
      }

      res.json({ message: 'Report deleted successfully' });
    });
  });
});

module.exports = router;
