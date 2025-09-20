const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const { filterContentByPrivacy } = require('../utils/privacy');

// Get user's applications with privacy filtering
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
      SELECT 
        a.id, a.opportunity_id, a.notes, a.status, a.created_at, a.updated_at,
        a.user_id as author_id,
        o.title, o.description, o.category, o.location, o.field,
        o.image_url, o.deadline, o.contact_info, o.application_url,
        o.is_external_application, u.username as created_by_username, u.full_name as created_by_name
      FROM applications a
      JOIN opportunities o ON a.opportunity_id = o.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
    `;

    db.query(query, [userId], async (err, result) => {
      if (err) {
        console.error('Error fetching applications:', err);
        return res.status(500).json({ error: 'Failed to fetch applications' });
      }

      // Filter applications based on privacy settings
      const filteredApplications = await filterContentByPrivacy(
        result.rows, 
        userId, 
        'applications_on_profile_visibility'
      );

      res.json(filteredApplications);
    });
  } catch (error) {
    console.error('Error in privacy filtering:', error);
    res.status(500).json({ error: 'Failed to filter applications' });
  }
});

// Apply for an opportunity
router.post('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { opportunity_id, notes } = req.body;

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

    // Check if already applied
    const checkApplicationQuery = 'SELECT id FROM applications WHERE user_id = $1 AND opportunity_id = $2';
    db.query(checkApplicationQuery, [userId, opportunity_id], (err, result) => {
      if (err) {
        console.error('Error checking existing application:', err);
        return res.status(500).json({ error: 'Failed to check existing application' });
      }

      if (result.rows.length > 0) {
        return res.status(409).json({ error: 'You have already applied for this opportunity' });
      }

      // Create application
      const insertQuery = `
        INSERT INTO applications (user_id, opportunity_id, notes, status, created_at, updated_at)
        VALUES ($1, $2, $3, 'pending', NOW(), NOW())
        RETURNING id, opportunity_id, notes, status, created_at, updated_at
      `;

      db.query(insertQuery, [userId, opportunity_id, notes || null], (err, result) => {
        if (err) {
          console.error('Error creating application:', err);
          return res.status(500).json({ error: 'Failed to create application' });
        }

        res.status(201).json({
          message: 'Application submitted successfully',
          application: result.rows[0]
        });
      });
    });
  });
});

// Check application status for an opportunity
router.get('/check/:opportunityId', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const opportunityId = req.params.opportunityId;

  const query = `
    SELECT id, status, created_at, notes
    FROM applications 
    WHERE user_id = $1 AND opportunity_id = $2
  `;

  db.query(query, [userId, opportunityId], (err, result) => {
    if (err) {
      console.error('Error checking application status:', err);
      return res.status(500).json({ error: 'Failed to check application status' });
    }

    if (result.rows.length === 0) {
      return res.json({ has_applied: false });
    }

    res.json({
      has_applied: true,
      application: result.rows[0]
    });
  });
});

// Remove application
router.delete('/:applicationId', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const applicationId = req.params.applicationId;

  const query = 'DELETE FROM applications WHERE id = $1 AND user_id = $2';
  db.query(query, [applicationId, userId], (err, result) => {
    if (err) {
      console.error('Error removing application:', err);
      return res.status(500).json({ error: 'Failed to remove application' });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Application removed successfully' });
  });
});

// Update application status (for opportunity creators)
router.put('/:applicationId/status', authenticateToken, (req, res) => {
  const applicationId = req.params.applicationId;
  const { status } = req.body;
  const userId = req.user.id;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  const validStatuses = ['pending', 'accepted', 'rejected', 'withdrawn'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
    });
  }

  // First check if the user has permission to update this application
  // (either the applicant or the opportunity creator)
  const checkQuery = `
    SELECT a.id, a.user_id, o.created_by
    FROM applications a
    JOIN opportunities o ON a.opportunity_id = o.id
    WHERE a.id = $1
  `;

  db.query(checkQuery, [applicationId], (err, result) => {
    if (err) {
      console.error('Error checking application permissions:', err);
      return res.status(500).json({ error: 'Failed to verify application permissions' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = result.rows[0];
    
    // Check if user is the applicant or the opportunity creator
    if (application.user_id !== userId && application.created_by !== userId) {
      return res.status(403).json({ 
        error: 'You can only update your own applications or applications for opportunities you created' 
      });
    }

    // Update the application status
    const updateQuery = `
      UPDATE applications 
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, opportunity_id, notes, status, created_at, updated_at
    `;

    db.query(updateQuery, [applicationId, status], (err, result) => {
      if (err) {
        console.error('Error updating application status:', err);
        return res.status(500).json({ error: 'Failed to update application status' });
      }

      res.json({
        message: 'Application status updated successfully',
        application: result.rows[0]
      });
    });
  });
});

// Get application by ID
router.get('/:applicationId', authenticateToken, (req, res) => {
  const applicationId = req.params.applicationId;
  const userId = req.user.id;

  const query = `
    SELECT 
      a.id, a.opportunity_id, a.notes, a.status, a.created_at, a.updated_at,
      o.title, o.description, o.category, o.location, o.field,
      o.image_url, o.deadline, o.contact_info, o.application_url,
      o.is_external_application, u.username as created_by_username, u.full_name as created_by_name
    FROM applications a
    JOIN opportunities o ON a.opportunity_id = o.id
    LEFT JOIN users u ON o.created_by = u.id
    WHERE a.id = $1 AND a.user_id = $2
  `;

  db.query(query, [applicationId, userId], (err, result) => {
    if (err) {
      console.error('Error fetching application:', err);
      return res.status(500).json({ error: 'Failed to fetch application' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(result.rows[0]);
  });
});

module.exports = router;
