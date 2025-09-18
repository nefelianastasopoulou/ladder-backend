const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Get user settings
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT 
      posts_on_profile_visibility, show_online_status, push_notifications,
      email_notifications, language, created_at, updated_at
    FROM user_settings 
    WHERE user_id = $1
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching user settings:', err);
      return res.status(500).json({ error: 'Failed to fetch user settings' });
    }

    if (result.rows.length === 0) {
      // Return default settings if none exist
      const defaultSettings = {
        posts_on_profile_visibility: 'public',
        show_online_status: true,
        push_notifications: true,
        email_notifications: true,
        language: 'en'
      };
      return res.json({ settings: defaultSettings });
    }

    res.json({ settings: result.rows[0] });
  });
});

// Update user settings
router.put('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const {
    posts_on_profile_visibility,
    show_online_status,
    push_notifications,
    email_notifications,
    language
  } = req.body;

  // Validate posts_on_profile_visibility
  if (posts_on_profile_visibility && !['public', 'private', 'friends'].includes(posts_on_profile_visibility)) {
    return res.status(400).json({ 
      error: 'posts_on_profile_visibility must be one of: public, private, friends' 
    });
  }

  // Validate language
  if (language && !['en', 'el', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'].includes(language)) {
    return res.status(400).json({ 
      error: 'Invalid language code' 
    });
  }

  // Check if settings exist
  const checkQuery = 'SELECT id FROM user_settings WHERE user_id = $1';
  db.query(checkQuery, [userId], (err, result) => {
    if (err) {
      console.error('Error checking existing settings:', err);
      return res.status(500).json({ error: 'Failed to check existing settings' });
    }

    if (result.rows.length > 0) {
      // Update existing settings
      updateSettings();
    } else {
      // Create new settings
      createSettings();
    }
  });

  function createSettings() {
    const query = `
      INSERT INTO user_settings (
        user_id, posts_on_profile_visibility, show_online_status,
        push_notifications, email_notifications, language, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING posts_on_profile_visibility, show_online_status, push_notifications,
                email_notifications, language, created_at, updated_at
    `;

    const values = [
      userId,
      posts_on_profile_visibility || 'public',
      show_online_status !== undefined ? show_online_status : true,
      push_notifications !== undefined ? push_notifications : true,
      email_notifications !== undefined ? email_notifications : true,
      language || 'en'
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error creating user settings:', err);
        return res.status(500).json({ error: 'Failed to create user settings' });
      }

      res.json({
        message: 'Settings created successfully',
        settings: result.rows[0]
      });
    });
  }

  function updateSettings() {
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (posts_on_profile_visibility !== undefined) {
      updateFields.push(`posts_on_profile_visibility = $${paramCount++}`);
      values.push(posts_on_profile_visibility);
    }
    if (show_online_status !== undefined) {
      updateFields.push(`show_online_status = $${paramCount++}`);
      values.push(show_online_status);
    }
    if (push_notifications !== undefined) {
      updateFields.push(`push_notifications = $${paramCount++}`);
      values.push(push_notifications);
    }
    if (email_notifications !== undefined) {
      updateFields.push(`email_notifications = $${paramCount++}`);
      values.push(email_notifications);
    }
    if (language !== undefined) {
      updateFields.push(`language = $${paramCount++}`);
      values.push(language);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No settings to update' });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE user_settings 
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING posts_on_profile_visibility, show_online_status, push_notifications,
                email_notifications, language, created_at, updated_at
    `;

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error updating user settings:', err);
        return res.status(500).json({ error: 'Failed to update user settings' });
      }

      res.json({
        message: 'Settings updated successfully',
        settings: result.rows[0]
      });
    });
  }
});

// Reset settings to defaults
router.post('/reset', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const defaultSettings = {
    posts_on_profile_visibility: 'public',
    show_online_status: true,
    push_notifications: true,
    email_notifications: true,
    language: 'en'
  };

  // Check if settings exist
  const checkQuery = 'SELECT id FROM user_settings WHERE user_id = $1';
  db.query(checkQuery, [userId], (err, result) => {
    if (err) {
      console.error('Error checking existing settings:', err);
      return res.status(500).json({ error: 'Failed to check existing settings' });
    }

    if (result.rows.length > 0) {
      // Update to defaults
      const updateQuery = `
        UPDATE user_settings 
        SET 
          posts_on_profile_visibility = $2,
          show_online_status = $3,
          push_notifications = $4,
          email_notifications = $5,
          language = $6,
          updated_at = NOW()
        WHERE user_id = $1
        RETURNING posts_on_profile_visibility, show_online_status, push_notifications,
                  email_notifications, language, created_at, updated_at
      `;

      const values = [
        userId,
        defaultSettings.posts_on_profile_visibility,
        defaultSettings.show_online_status,
        defaultSettings.push_notifications,
        defaultSettings.email_notifications,
        defaultSettings.language
      ];

      db.query(updateQuery, values, (err, result) => {
        if (err) {
          console.error('Error resetting user settings:', err);
          return res.status(500).json({ error: 'Failed to reset user settings' });
        }

        res.json({
          message: 'Settings reset to defaults',
          settings: result.rows[0]
        });
      });
    } else {
      // Create with defaults
      const insertQuery = `
        INSERT INTO user_settings (
          user_id, posts_on_profile_visibility, show_online_status,
          push_notifications, email_notifications, language, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING posts_on_profile_visibility, show_online_status, push_notifications,
                  email_notifications, language, created_at, updated_at
      `;

      const values = [
        userId,
        defaultSettings.posts_on_profile_visibility,
        defaultSettings.show_online_status,
        defaultSettings.push_notifications,
        defaultSettings.email_notifications,
        defaultSettings.language
      ];

      db.query(insertQuery, values, (err, result) => {
        if (err) {
          console.error('Error creating default user settings:', err);
          return res.status(500).json({ error: 'Failed to create default user settings' });
        }

        res.json({
          message: 'Default settings created',
          settings: result.rows[0]
        });
      });
    }
  });
});

module.exports = router;
