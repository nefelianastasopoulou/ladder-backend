const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Save onboarding data
router.post('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { age_range, field_of_study, academic_level, university, preferences } = req.body;

  // Validate required fields
  if (!age_range || !field_of_study || !academic_level) {
    return res.status(400).json({ 
      error: 'age_range, field_of_study, and academic_level are required' 
    });
  }

  // Validate field_of_study is an array
  if (!Array.isArray(field_of_study)) {
    return res.status(400).json({ 
      error: 'field_of_study must be an array' 
    });
  }

  // Check if user already has onboarding data
  const checkQuery = 'SELECT id FROM user_onboarding WHERE user_id = $1';
  db.query(checkQuery, [userId], (err, result) => {
    if (err) {
      console.error('Error checking existing onboarding data:', err);
      return res.status(500).json({ error: 'Failed to check onboarding data' });
    }

    if (result.rows.length > 0) {
      // Update existing onboarding data
      updateOnboardingData();
    } else {
      // Create new onboarding data
      createOnboardingData();
    }
  });

  function createOnboardingData() {
    const query = `
      INSERT INTO user_onboarding (
        user_id, age_range, field_of_study, academic_level, 
        university, preferences, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, age_range, field_of_study, academic_level, 
                university, preferences, created_at, updated_at
    `;

    const values = [
      userId, 
      age_range, 
      JSON.stringify(field_of_study), 
      academic_level, 
      university || null, 
      preferences ? JSON.stringify(preferences) : null
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error creating onboarding data:', err);
        return res.status(500).json({ error: 'Failed to save onboarding data' });
      }

      const onboardingData = result.rows[0];
      // Parse JSON fields back to objects
      onboardingData.field_of_study = JSON.parse(onboardingData.field_of_study);
      onboardingData.preferences = onboardingData.preferences ? JSON.parse(onboardingData.preferences) : null;

      res.status(201).json({
        message: 'Onboarding data saved successfully',
        onboarding: onboardingData
      });
    });
  }

  function updateOnboardingData() {
    const query = `
      UPDATE user_onboarding 
      SET 
        age_range = $2,
        field_of_study = $3,
        academic_level = $4,
        university = $5,
        preferences = $6,
        updated_at = NOW()
      WHERE user_id = $1
      RETURNING id, age_range, field_of_study, academic_level, 
                university, preferences, created_at, updated_at
    `;

    const values = [
      userId, 
      age_range, 
      JSON.stringify(field_of_study), 
      academic_level, 
      university || null, 
      preferences ? JSON.stringify(preferences) : null
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error updating onboarding data:', err);
        return res.status(500).json({ error: 'Failed to update onboarding data' });
      }

      const onboardingData = result.rows[0];
      // Parse JSON fields back to objects
      onboardingData.field_of_study = JSON.parse(onboardingData.field_of_study);
      onboardingData.preferences = onboardingData.preferences ? JSON.parse(onboardingData.preferences) : null;

      res.json({
        message: 'Onboarding data updated successfully',
        onboarding: onboardingData
      });
    });
  }
});

// Get user's onboarding data
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      id, age_range, field_of_study, academic_level, 
      university, preferences, created_at, updated_at
    FROM user_onboarding 
    WHERE user_id = $1
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching onboarding data:', err);
      return res.status(500).json({ error: 'Failed to fetch onboarding data' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Onboarding data not found' });
    }

    const onboardingData = result.rows[0];
    // Parse JSON fields back to objects
    onboardingData.field_of_study = JSON.parse(onboardingData.field_of_study);
    onboardingData.preferences = onboardingData.preferences ? JSON.parse(onboardingData.preferences) : null;

    res.json({ onboarding: onboardingData });
  });
});

// Check if user has completed onboarding
router.get('/status', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = 'SELECT id FROM user_onboarding WHERE user_id = $1';
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error checking onboarding status:', err);
      return res.status(500).json({ error: 'Failed to check onboarding status' });
    }

    res.json({
      completed: result.rows.length > 0
    });
  });
});

module.exports = router;
