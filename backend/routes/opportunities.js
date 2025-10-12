const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const { filterContentByPrivacy } = require('../utils/privacy');

// Get all opportunities with privacy filtering
router.get('/', authenticateToken, async (req, res) => {
  const viewerId = req.user.id;

  try {
    const query = `
      SELECT 
        o.id, o.title, o.description, o.category, o.location, o.field,
        o.image_url, o.deadline, o.requirements, o.contact_info,
        o.application_url, o.is_external_application, o.allow_questions, 
        o.social_media_urls, o.created_at, o.updated_at,
        o.created_by as author_id,
        u.username as created_by_username, u.full_name as created_by_name
      FROM opportunities o
      LEFT JOIN users u ON o.created_by = u.id
      ORDER BY o.created_at DESC
    `;

    db.query(query, [], async (err, result) => {
      if (err) {
        console.error('Error fetching opportunities:', err);
        return res.status(500).json({ error: 'Failed to fetch opportunities' });
      }

      // Return all opportunities without privacy filtering
      // Privacy filtering should only apply to profile pages, not the main feed
      res.json(result.rows);
    });
  } catch (error) {
    console.error('Error in privacy filtering:', error);
    res.status(500).json({ error: 'Failed to filter opportunities' });
  }
});

// Get user's opportunities
router.get('/my', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      o.id, o.title, o.description, o.category, o.location, o.field,
      o.image_url, o.deadline, o.requirements, o.contact_info,
      o.application_url, o.is_external_application, o.allow_questions,
      o.social_media_urls, o.created_at, o.updated_at
    FROM opportunities o
    WHERE o.created_by = $1
    ORDER BY o.created_at DESC
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching user opportunities:', err);
      return res.status(500).json({ error: 'Failed to fetch your opportunities' });
    }

    res.json(result.rows);
  });
});

// Create new opportunity
router.post('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const {
    title, description, category, location, field, image_url, image_key,
    deadline, requirements, contact_info, application_url, is_external_application,
    allow_questions, social_media_urls
  } = req.body;

  // Validate required fields
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const query = `
    INSERT INTO opportunities (
      title, description, category, location, field, image_url, image_key,
      deadline, requirements, contact_info, application_url, 
      is_external_application, allow_questions, social_media_urls, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id, title, description, category, location, field,
              image_url, image_key, deadline, requirements, contact_info,
              application_url, is_external_application, allow_questions, 
              social_media_urls, created_at
  `;

  const values = [
    title, description, category, location, field, image_url, image_key,
    deadline, requirements, contact_info, application_url,
    is_external_application || false, 
    allow_questions !== undefined ? allow_questions : true,
    social_media_urls ? JSON.stringify(social_media_urls) : null,
    userId
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error creating opportunity:', err);
      return res.status(500).json({ error: 'Failed to create opportunity' });
    }

    res.status(201).json({
      message: 'Opportunity created successfully',
      opportunity: result.rows[0]
    });
  });
});

// Get opportunity by ID
router.get('/:id', (req, res) => {
  const opportunityId = req.params.id;

  const query = `
    SELECT 
      o.id, o.title, o.description, o.category, o.location, o.field,
      o.image_url, o.deadline, o.requirements, o.contact_info,
      o.application_url, o.is_external_application, o.allow_questions,
      o.social_media_urls, o.created_at, o.updated_at,
      u.username as created_by_username, u.full_name as created_by_name
    FROM opportunities o
    LEFT JOIN users u ON o.created_by = u.id
    WHERE o.id = $1
  `;

  db.query(query, [opportunityId], (err, result) => {
    if (err) {
      console.error('Error fetching opportunity:', err);
      return res.status(500).json({ error: 'Failed to fetch opportunity' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json(result.rows[0]);
  });
});

// Update opportunity
router.put('/:id', authenticateToken, (req, res) => {
  const opportunityId = req.params.id;
  const userId = req.user.id;
  const {
    title, description, category, location, field, image_url,
    deadline, requirements, contact_info, application_url, is_external_application,
    allow_questions, social_media_urls
  } = req.body;

  // First check if the opportunity exists and belongs to the user
  const checkQuery = 'SELECT created_by FROM opportunities WHERE id = $1';
  db.query(checkQuery, [opportunityId], (err, result) => {
    if (err) {
      console.error('Error checking opportunity ownership:', err);
      return res.status(500).json({ error: 'Failed to verify opportunity ownership' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    if (result.rows[0].created_by !== userId) {
      return res.status(403).json({ error: 'You can only update your own opportunities' });
    }

    // Build update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (title) {
      updateFields.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (category) {
      updateFields.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (location) {
      updateFields.push(`location = $${paramCount++}`);
      values.push(location);
    }
    if (field) {
      updateFields.push(`field = $${paramCount++}`);
      values.push(field);
    }
    if (image_url !== undefined) {
      updateFields.push(`image_url = $${paramCount++}`);
      values.push(image_url);
    }
    if (deadline) {
      updateFields.push(`deadline = $${paramCount++}`);
      values.push(deadline);
    }
    if (requirements !== undefined) {
      updateFields.push(`requirements = $${paramCount++}`);
      values.push(requirements);
    }
    if (contact_info !== undefined) {
      updateFields.push(`contact_info = $${paramCount++}`);
      values.push(contact_info);
    }
    if (application_url !== undefined) {
      updateFields.push(`application_url = $${paramCount++}`);
      values.push(application_url);
    }
    if (is_external_application !== undefined) {
      updateFields.push(`is_external_application = $${paramCount++}`);
      values.push(is_external_application);
    }
    if (allow_questions !== undefined) {
      updateFields.push(`allow_questions = $${paramCount++}`);
      values.push(allow_questions);
    }
    if (social_media_urls !== undefined) {
      updateFields.push(`social_media_urls = $${paramCount++}`);
      values.push(JSON.stringify(social_media_urls));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(opportunityId);

    const updateQuery = `
      UPDATE opportunities 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, title, description, category, location, field,
                image_url, deadline, requirements, contact_info,
                application_url, is_external_application, allow_questions,
                social_media_urls, created_at, updated_at
    `;

    db.query(updateQuery, values, (err, result) => {
      if (err) {
        console.error('Error updating opportunity:', err);
        return res.status(500).json({ error: 'Failed to update opportunity' });
      }

      res.json({
        message: 'Opportunity updated successfully',
        opportunity: result.rows[0]
      });
    });
  });
});

// Delete opportunity
router.delete('/:id', authenticateToken, (req, res) => {
  const opportunityId = req.params.id;
  const userId = req.user.id;

  // First check if the opportunity exists and belongs to the user
  const checkQuery = 'SELECT created_by FROM opportunities WHERE id = $1';
  db.query(checkQuery, [opportunityId], (err, result) => {
    if (err) {
      console.error('Error checking opportunity ownership:', err);
      return res.status(500).json({ error: 'Failed to verify opportunity ownership' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    if (result.rows[0].created_by !== userId) {
      return res.status(403).json({ error: 'You can only delete your own opportunities' });
    }

    // Delete the opportunity
    const deleteQuery = 'DELETE FROM opportunities WHERE id = $1';
    db.query(deleteQuery, [opportunityId], (err, result) => {
      if (err) {
        console.error('Error deleting opportunity:', err);
        return res.status(500).json({ error: 'Failed to delete opportunity' });
      }

      res.json({ message: 'Opportunity deleted successfully' });
    });
  });
});

module.exports = router;
