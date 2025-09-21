/**
 * Communities Routes
 * Handles community creation, management, and interactions
 */

const express = require('express');
const { validate, schemas } = require('../middleware/validation');
const { sendSuccessResponse, sendErrorResponse, sendNotFoundError, sendPaginatedResponse } = require('../utils/response');
const logger = require('../utils/logger');
const db = require('../database');

const router = express.Router();

/**
 * Get All Communities
 * GET /api/communities
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.id, c.name, c.description, c.category, c.is_public, c.created_at,
             c.creator_id, u.username as creator_username,
             COUNT(cm.user_id) as member_count
      FROM communities c
      LEFT JOIN users u ON c.creator_id = u.id
      LEFT JOIN community_members cm ON c.id = cm.community_id
      WHERE c.is_public = true
    `;
    
    const queryParams = [];
    let paramCount = 0;

    // Add search filter
    if (search) {
      paramCount++;
      query += ` AND (c.name ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Add category filter
    if (category) {
      paramCount++;
      query += ` AND c.category = $${paramCount}`;
      queryParams.push(category);
    }

    query += ` GROUP BY c.id, u.username ORDER BY c.created_at DESC`;

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM communities c
      WHERE c.is_public = true
      ${search ? `AND (c.name ILIKE '%${search}%' OR c.description ILIKE '%${search}%')` : ''}
      ${category ? `AND c.category = '${category}'` : ''}
    `;

    const [communitiesResult, countResult] = await Promise.all([
      db.query(query + ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`, 
               [...queryParams, limit, offset]),
      db.query(countQuery)
    ]);

    const communities = communitiesResult.rows;
    const total = parseInt(countResult.rows[0].total);

    // Add membership status for each community
    const communitiesWithMembership = await Promise.all(
      communities.map(async (community) => {
        const membership = await db.query(
          'SELECT id FROM community_members WHERE community_id = $1 AND user_id = $2',
          [community.id, req.user.id]
        );
        return {
          ...community,
          is_member: membership.rows.length > 0
        };
      })
    );

    sendPaginatedResponse(res, communitiesWithMembership, parseInt(page), parseInt(limit), total, 'Communities retrieved successfully');

  } catch (error) {
    logger.error('Get communities failed:', error);
    sendErrorResponse(res, 500, 'Failed to retrieve communities');
  }
});

/**
 * Get Community by ID
 * GET /api/communities/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const community = await db.query(`
      SELECT c.id, c.name, c.description, c.category, c.is_public, c.created_at,
             c.creator_id, u.username as creator_username, u.full_name as creator_name,
             COUNT(cm.user_id) as member_count
      FROM communities c
      LEFT JOIN users u ON c.creator_id = u.id
      LEFT JOIN community_members cm ON c.id = cm.community_id
      WHERE c.id = $1
      GROUP BY c.id, u.username, u.full_name
    `, [id]);

    if (community.rows.length === 0) {
      return sendNotFoundError(res, 'Community not found');
    }

    const communityData = community.rows[0];

    // Check if user is a member (if authenticated)
    let isMember = false;
    if (req.user) {
      const membership = await db.query(
        'SELECT id FROM community_members WHERE community_id = $1 AND user_id = $2',
        [id, req.user.id]
      );
      isMember = membership.rows.length > 0;
    }

    sendSuccessResponse(res, 200, 'Community retrieved successfully', {
      ...communityData,
      isMember
    });

  } catch (error) {
    logger.error('Get community failed:', error);
    sendErrorResponse(res, 500, 'Failed to retrieve community');
  }
});

/**
 * Create Community
 * POST /api/communities
 */
router.post('/', validate(schemas.community.create), async (req, res) => {
  try {
    const { name, description, category, is_public = true } = req.body;

    // Check if community name already exists
    const existingCommunity = await db.query(
      'SELECT id FROM communities WHERE name = $1',
      [name]
    );

    if (existingCommunity.rows.length > 0) {
      return sendErrorResponse(res, 409, 'Community with this name already exists');
    }

    // Create community
    const newCommunity = await db.query(`
      INSERT INTO communities (name, description, category, is_public, creator_id, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, name, description, category, is_public, creator_id, created_at
    `, [name, description, category, is_public, req.user.id]);

    const community = newCommunity.rows[0];

    // Add creator as a member
    await db.query(`
      INSERT INTO community_members (community_id, user_id, role, joined_at)
      VALUES ($1, $2, 'admin', NOW())
    `, [community.id, req.user.id]);

    logger.info('Community created successfully', {
      communityId: community.id,
      communityName: community.name,
      creatorId: req.user.id,
      ip: req.ip
    });

    sendSuccessResponse(res, 201, 'Community created successfully', {
      ...community,
      memberCount: 1,
      isMember: true
    });

  } catch (error) {
    logger.error('Community creation failed:', error);
    sendErrorResponse(res, 500, 'Failed to create community');
  }
});

/**
 * Update Community
 * PUT /api/communities/:id
 */
router.put('/:id', validate(schemas.community.update), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Ensure we have at least one field to update
    if (!name && !description) {
      return sendErrorResponse(res, 400, 'At least one field must be provided for update');
    }

    // Check if community exists and user has permission
    const community = await db.query(`
      SELECT c.*, cm.role
      FROM communities c
      LEFT JOIN community_members cm ON c.id = cm.community_id AND cm.user_id = $2
      WHERE c.id = $1
    `, [id, req.user.id]);

    if (community.rows.length === 0) {
      return sendNotFoundError(res, 'Community not found');
    }

    const communityData = community.rows[0];

    // Check permissions (creator or admin)
    if (communityData.creator_id !== req.user.id && communityData.role !== 'admin') {
      return sendErrorResponse(res, 403, 'You do not have permission to update this community');
    }

    // Check if new name conflicts (if name is being changed)
    if (name && name !== communityData.name) {
      const existingCommunity = await db.query(
        'SELECT id FROM communities WHERE name = $1 AND id != $2',
        [name, id]
      );

      if (existingCommunity.rows.length > 0) {
        return sendErrorResponse(res, 409, 'Community with this name already exists');
      }
    }

    // Update community
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (name !== undefined) {
      paramCount++;
      updateFields.push(`name = $${paramCount}`);
      updateValues.push(name);
    }

    if (description !== undefined) {
      paramCount++;
      updateFields.push(`description = $${paramCount}`);
      updateValues.push(description);
    }


    if (updateFields.length === 0) {
      return sendErrorResponse(res, 400, 'No fields to update');
    }

    paramCount++;
    updateFields.push(`updated_at = NOW()`);
    paramCount++;
    updateValues.push(id);

    const updatedCommunity = await db.query(`
      UPDATE communities 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, description, category, is_public, creator_id, created_at, updated_at
    `, updateValues);

    logger.info('Community updated successfully', {
      communityId: id,
      updatedFields: Object.keys(req.body),
      updatedBy: req.user.id,
      ip: req.ip
    });

    sendSuccessResponse(res, 200, 'Community updated successfully', updatedCommunity.rows[0]);

  } catch (error) {
    logger.error('Community update failed:', error);
    sendErrorResponse(res, 500, 'Failed to update community');
  }
});

/**
 * Join Community
 * POST /api/communities/:id/join
 */
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if community exists
    const community = await db.query(
      'SELECT id, is_public FROM communities WHERE id = $1',
      [id]
    );

    if (community.rows.length === 0) {
      return sendNotFoundError(res, 'Community not found');
    }

    // Check if community is public
    if (!community.rows[0].is_public) {
      return sendErrorResponse(res, 403, 'This community is private');
    }

    // Check if user is already a member
    const existingMembership = await db.query(
      'SELECT id FROM community_members WHERE community_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existingMembership.rows.length > 0) {
      return sendErrorResponse(res, 409, 'You are already a member of this community');
    }

    // Add user to community
    await db.query(`
      INSERT INTO community_members (community_id, user_id, role, joined_at)
      VALUES ($1, $2, 'member', NOW())
    `, [id, req.user.id]);

    logger.info('User joined community', {
      communityId: id,
      userId: req.user.id,
      ip: req.ip
    });

    sendSuccessResponse(res, 200, 'Successfully joined community');

  } catch (error) {
    logger.error('Join community failed:', error);
    sendErrorResponse(res, 500, 'Failed to join community');
  }
});

/**
 * Leave Community
 * POST /api/communities/:id/leave
 */
router.post('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is a member
    const membership = await db.query(
      'SELECT id, role FROM community_members WHERE community_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (membership.rows.length === 0) {
      return sendErrorResponse(res, 404, 'You are not a member of this community');
    }

    // Check if user is the creator
    const community = await db.query(
      'SELECT creator_id FROM communities WHERE id = $1',
      [id]
    );

    if (community.rows[0].creator_id === req.user.id) {
      return sendErrorResponse(res, 403, 'Community creators cannot leave their own community');
    }

    // Remove user from community
    await db.query(
      'DELETE FROM community_members WHERE community_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    logger.info('User left community', {
      communityId: id,
      userId: req.user.id,
      ip: req.ip
    });

    sendSuccessResponse(res, 200, 'Successfully left community');

  } catch (error) {
    logger.error('Leave community failed:', error);
    sendErrorResponse(res, 500, 'Failed to leave community');
  }
});

/**
 * Get Community Members
 * GET /api/communities/:id/members
 */
router.get('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Check if community exists
    const community = await db.query(
      'SELECT id FROM communities WHERE id = $1',
      [id]
    );

    if (community.rows.length === 0) {
      return sendNotFoundError(res, 'Community not found');
    }

    // Get members
    const members = await db.query(`
      SELECT u.id, u.username, u.full_name, u.created_at,
             cm.role, cm.joined_at
      FROM community_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.community_id = $1
      ORDER BY cm.joined_at ASC
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);

    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM community_members WHERE community_id = $1',
      [id]
    );

    const total = parseInt(countResult.rows[0].total);

    sendPaginatedResponse(res, members.rows, parseInt(page), parseInt(limit), total, 'Community members retrieved successfully');

  } catch (error) {
    logger.error('Get community members failed:', error);
    sendErrorResponse(res, 500, 'Failed to retrieve community members');
  }
});

/**
 * Get Community Posts
 * GET /api/communities/:id/posts
 */
router.get('/:id/posts', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Check if community exists
    const community = await db.query(
      'SELECT id, is_public FROM communities WHERE id = $1',
      [id]
    );

    if (community.rows.length === 0) {
      return sendNotFoundError(res, 'Community not found');
    }

    // Check if user has access to community posts
    if (!community.rows[0].is_public) {
      // Check if user is a member
      const membership = await db.query(
        'SELECT id FROM community_members WHERE community_id = $1 AND user_id = $2',
        [id, req.user.id]
      );

      if (membership.rows.length === 0) {
        return sendErrorResponse(res, 403, 'You do not have access to this community\'s posts');
      }
    }

    // Get posts
    const posts = await db.query(`
      SELECT 
        p.id, p.title, p.content, p.image_url, p.likes_count, p.comments_count,
        p.created_at, p.updated_at, p.author_id,
        u.username as author_username, u.full_name as author_name, u.avatar_url as author_avatar,
        CASE WHEN l.user_id IS NOT NULL THEN true ELSE false END as is_liked
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id AND l.user_id = $4
      WHERE p.community_id = $1 AND p.is_published = true
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [id, limit, offset, req.user.id]);

    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM posts WHERE community_id = $1 AND is_published = true',
      [id]
    );

    const total = parseInt(countResult.rows[0].total);

    sendPaginatedResponse(res, posts.rows, parseInt(page), parseInt(limit), total, 'Community posts retrieved successfully');

  } catch (error) {
    logger.error('Get community posts failed:', error);
    sendErrorResponse(res, 500, 'Failed to retrieve community posts');
  }
});

/**
 * Create Community Post
 * POST /api/communities/:id/posts
 */
router.post('/:id/posts', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, image_url } = req.body;

    // Validate required fields
    if (!title || !content) {
      return sendErrorResponse(res, 400, 'Title and content are required');
    }

    // Check if community exists
    const community = await db.query(
      'SELECT id, is_public FROM communities WHERE id = $1',
      [id]
    );

    if (community.rows.length === 0) {
      return sendNotFoundError(res, 'Community not found');
    }

    // Check if user is a member
    const membership = await db.query(
      'SELECT id, role FROM community_members WHERE community_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (membership.rows.length === 0) {
      return sendErrorResponse(res, 403, 'You must be a member of this community to post');
    }

    // Create post
    const newPost = await db.query(`
      INSERT INTO posts (title, content, author_id, community_id, image_url, is_published, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      RETURNING id, title, content, image_url, created_at, updated_at
    `, [title, content, req.user.id, id, image_url || null]);

    logger.info('Community post created successfully', {
      postId: newPost.rows[0].id,
      communityId: id,
      authorId: req.user.id,
      ip: req.ip
    });

    sendSuccessResponse(res, 201, 'Post created successfully', newPost.rows[0]);

  } catch (error) {
    logger.error('Create community post failed:', error);
    sendErrorResponse(res, 500, 'Failed to create post');
  }
});

/**
 * Delete Community
 * DELETE /api/communities/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if community exists
    const community = await db.query(
      'SELECT id, name, creator_id FROM communities WHERE id = $1',
      [id]
    );

    if (community.rows.length === 0) {
      return sendNotFoundError(res, 'Community not found');
    }

    const communityData = community.rows[0];

    // Check if user is the creator
    if (communityData.creator_id !== req.user.id) {
      return sendErrorResponse(res, 403, 'Only the community creator can delete this community');
    }

    // Delete community (cascade will handle related records)
    await db.query('DELETE FROM communities WHERE id = $1', [id]);

    logger.info('Community deleted successfully', {
      communityId: id,
      communityName: communityData.name,
      deletedBy: req.user.id,
      ip: req.ip
    });

    sendSuccessResponse(res, 200, 'Community deleted successfully');

  } catch (error) {
    logger.error('Community deletion failed:', error);
    sendErrorResponse(res, 500, 'Failed to delete community');
  }
});

module.exports = router;