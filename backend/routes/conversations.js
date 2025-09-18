const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Get user's conversations
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT DISTINCT
      c.id, c.type, c.name, c.description, c.created_at, c.updated_at,
      CASE 
        WHEN c.type = 'individual' THEN
          CASE 
            WHEN c.user1_id = $1 THEN u2.username
            ELSE u1.username
          END
        ELSE c.name
      END as display_name,
      CASE 
        WHEN c.type = 'individual' THEN
          CASE 
            WHEN c.user1_id = $1 THEN u2.full_name
            ELSE u1.full_name
          END
        ELSE c.name
      END as full_display_name,
      CASE 
        WHEN c.type = 'individual' THEN
          CASE 
            WHEN c.user1_id = $1 THEN u2.avatar_url
            ELSE u1.avatar_url
          END
        ELSE NULL
      END as avatar_url,
      CASE 
        WHEN c.type = 'individual' THEN
          CASE 
            WHEN c.user1_id = $1 THEN u2.id
            ELSE u1.id
          END
        ELSE NULL
      END as other_user_id,
      m.content as last_message_content,
      m.message_type as last_message_type,
      m.created_at as last_message_time,
      mu.username as last_message_author
    FROM conversations c
    LEFT JOIN users u1 ON c.user1_id = u1.id
    LEFT JOIN users u2 ON c.user2_id = u2.id
    LEFT JOIN LATERAL (
      SELECT content, message_type, created_at, author_id
      FROM messages 
      WHERE conversation_id = c.id 
      ORDER BY created_at DESC 
      LIMIT 1
    ) m ON true
    LEFT JOIN users mu ON m.author_id = mu.id
    WHERE c.user1_id = $1 OR c.user2_id = $1
    ORDER BY COALESCE(m.created_at, c.updated_at, c.created_at) DESC
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching conversations:', err);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }

    res.json(result.rows);
  });
});

// Create individual conversation
router.post('/individual', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { other_user_id } = req.body;

  if (!other_user_id) {
    return res.status(400).json({ error: 'other_user_id is required' });
  }

  if (other_user_id == userId) {
    return res.status(400).json({ error: 'Cannot create conversation with yourself' });
  }

  // Check if other user exists
  const checkUserQuery = 'SELECT id FROM users WHERE id = $1';
  db.query(checkUserQuery, [other_user_id], (err, result) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).json({ error: 'Failed to verify user' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if conversation already exists
    const checkConversationQuery = `
      SELECT id FROM conversations 
      WHERE type = 'individual' 
      AND ((user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1))
    `;

    db.query(checkConversationQuery, [userId, other_user_id], (err, result) => {
      if (err) {
        console.error('Error checking existing conversation:', err);
        return res.status(500).json({ error: 'Failed to check existing conversation' });
      }

      if (result.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Conversation already exists',
          conversation_id: result.rows[0].id
        });
      }

      // Create new conversation
      const createQuery = `
        INSERT INTO conversations (type, user1_id, user2_id, created_at, updated_at)
        VALUES ('individual', $1, $2, NOW(), NOW())
        RETURNING id, type, created_at, updated_at
      `;

      db.query(createQuery, [userId, other_user_id], (err, result) => {
        if (err) {
          console.error('Error creating conversation:', err);
          return res.status(500).json({ error: 'Failed to create conversation' });
        }

        res.status(201).json({
          message: 'Conversation created successfully',
          conversation: result.rows[0]
        });
      });
    });
  });
});

// Get messages for a conversation
router.get('/:conversationId/messages', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const conversationId = req.params.conversationId;
  const { limit = 50, offset = 0 } = req.query;

  // First check if user has access to this conversation
  const checkAccessQuery = `
    SELECT id FROM conversations 
    WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
  `;

  db.query(checkAccessQuery, [conversationId, userId], (err, result) => {
    if (err) {
      console.error('Error checking conversation access:', err);
      return res.status(500).json({ error: 'Failed to verify conversation access' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found or access denied' });
    }

    // Get messages
    const messagesQuery = `
      SELECT 
        m.id, m.content, m.message_type, m.created_at, m.updated_at,
        u.username as author_username, u.full_name as author_name, u.avatar_url as author_avatar
      FROM messages m
      LEFT JOIN users u ON m.author_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    db.query(messagesQuery, [conversationId, parseInt(limit), parseInt(offset)], (err, result) => {
      if (err) {
        console.error('Error fetching messages:', err);
        return res.status(500).json({ error: 'Failed to fetch messages' });
      }

      // Reverse the array to show oldest messages first
      const messages = result.rows.reverse();

      res.json({ messages });
    });
  });
});

// Send message to conversation
router.post('/:conversationId/messages', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const conversationId = req.params.conversationId;
  const { content, message_type = 'text' } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  if (content.length > 1000) {
    return res.status(400).json({ error: 'Message content is too long (max 1000 characters)' });
  }

  const validMessageTypes = ['text', 'image', 'file', 'link'];
  if (!validMessageTypes.includes(message_type)) {
    return res.status(400).json({ 
      error: `Invalid message type. Must be one of: ${validMessageTypes.join(', ')}` 
    });
  }

  // First check if user has access to this conversation
  const checkAccessQuery = `
    SELECT id FROM conversations 
    WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)
  `;

  db.query(checkAccessQuery, [conversationId, userId], (err, result) => {
    if (err) {
      console.error('Error checking conversation access:', err);
      return res.status(500).json({ error: 'Failed to verify conversation access' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found or access denied' });
    }

    // Create message
    const createMessageQuery = `
      INSERT INTO messages (conversation_id, author_id, content, message_type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, content, message_type, created_at, updated_at
    `;

    db.query(createMessageQuery, [conversationId, userId, content.trim(), message_type], (err, result) => {
      if (err) {
        console.error('Error creating message:', err);
        return res.status(500).json({ error: 'Failed to send message' });
      }

      // Update conversation timestamp
      const updateConversationQuery = `
        UPDATE conversations 
        SET updated_at = NOW() 
        WHERE id = $1
      `;

      db.query(updateConversationQuery, [conversationId], (err) => {
        if (err) {
          console.error('Error updating conversation timestamp:', err);
          // Don't fail the request, just log the error
        }

        res.status(201).json({
          message: 'Message sent successfully',
          message_data: result.rows[0]
        });
      });
    });
  });
});

// Get conversation by ID
router.get('/:conversationId', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const conversationId = req.params.conversationId;

  const query = `
    SELECT 
      c.id, c.type, c.name, c.description, c.created_at, c.updated_at,
      CASE 
        WHEN c.type = 'individual' THEN
          CASE 
            WHEN c.user1_id = $1 THEN u2.username
            ELSE u1.username
          END
        ELSE c.name
      END as display_name,
      CASE 
        WHEN c.type = 'individual' THEN
          CASE 
            WHEN c.user1_id = $1 THEN u2.full_name
            ELSE u1.full_name
          END
        ELSE c.name
      END as full_display_name,
      CASE 
        WHEN c.type = 'individual' THEN
          CASE 
            WHEN c.user1_id = $1 THEN u2.avatar_url
            ELSE u1.avatar_url
          END
        ELSE NULL
      END as avatar_url,
      CASE 
        WHEN c.type = 'individual' THEN
          CASE 
            WHEN c.user1_id = $1 THEN u2.id
            ELSE u1.id
          END
        ELSE NULL
      END as other_user_id
    FROM conversations c
    LEFT JOIN users u1 ON c.user1_id = u1.id
    LEFT JOIN users u2 ON c.user2_id = u2.id
    WHERE c.id = $2 AND (c.user1_id = $1 OR c.user2_id = $1)
  `;

  db.query(query, [userId, conversationId], (err, result) => {
    if (err) {
      console.error('Error fetching conversation:', err);
      return res.status(500).json({ error: 'Failed to fetch conversation' });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found or access denied' });
    }

    res.json(result.rows[0]);
  });
});

module.exports = router;
