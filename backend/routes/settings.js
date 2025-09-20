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
      community_posts_visibility, show_activity_status, push_notifications,
      email_notifications, language
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
        community_posts_visibility: 'public',
        show_activity_status: true,
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
    community_posts_visibility,
    show_activity_status,
    push_notifications,
    email_notifications,
    language
  } = req.body;

  // Validate community_posts_visibility
  if (community_posts_visibility && !['public', 'private', 'friends'].includes(community_posts_visibility)) {
    return res.status(400).json({ 
      error: 'community_posts_visibility must be one of: public, private, friends' 
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
        user_id, community_posts_visibility, show_activity_status,
        push_notifications, email_notifications, language
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING community_posts_visibility, show_activity_status, push_notifications,
                email_notifications, language
    `;

    const values = [
      userId,
      community_posts_visibility || 'public',
      show_activity_status !== undefined ? show_activity_status : true,
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

    if (community_posts_visibility !== undefined) {
      updateFields.push(`community_posts_visibility = $${paramCount++}`);
      values.push(community_posts_visibility);
    }
    if (show_activity_status !== undefined) {
      updateFields.push(`show_activity_status = $${paramCount++}`);
      values.push(show_activity_status);
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

    values.push(userId);

    const query = `
      UPDATE user_settings 
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING community_posts_visibility, show_activity_status, push_notifications,
                email_notifications, language
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
    community_posts_visibility: 'public',
    show_activity_status: true,
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
          community_posts_visibility = $2,
          show_activity_status = $3,
          push_notifications = $4,
          email_notifications = $5,
          language = $6
        WHERE user_id = $1
        RETURNING community_posts_visibility, show_activity_status, push_notifications,
                  email_notifications, language
      `;

      const values = [
        userId,
        defaultSettings.community_posts_visibility,
        defaultSettings.show_activity_status,
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
          user_id, community_posts_visibility, show_activity_status,
          push_notifications, email_notifications, language
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING community_posts_visibility, show_activity_status, push_notifications,
                  email_notifications, language
      `;

      const values = [
        userId,
        defaultSettings.community_posts_visibility,
        defaultSettings.show_activity_status,
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
