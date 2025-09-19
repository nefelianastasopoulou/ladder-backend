// Database Query Optimization Utilities
// This module provides optimized query patterns to prevent N+1 queries

const db = require('../database');

class QueryOptimizer {
  // Optimized user queries with joins
  static async getUsersWithProfiles(userIds = null, limit = 50, offset = 0) {
    const query = `
      SELECT 
        u.id, u.email, u.username, u.full_name, u.role, u.created_at,
        up.bio, up.location, up.field, up.avatar_url,
        us.photo_upload_restriction, us.allowed_photo_sources
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN user_settings us ON u.id = us.user_id
      ${userIds ? 'WHERE u.id = ANY($1)' : ''}
      ORDER BY u.created_at DESC
      LIMIT $${userIds ? '2' : '1'} OFFSET $${userIds ? '3' : '2'}
    `;
    
    const params = userIds ? [userIds, limit, offset] : [limit, offset];
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, result) => {
        if (err) return reject(err);
        resolve(result.rows);
      });
    });
  }

  // Optimized posts with author and community info
  static async getPostsWithDetails(filters = {}, limit = 20, offset = 0) {
    const { authorId, communityId, category, isPublished = true } = filters;
    
    let whereClause = 'WHERE p.is_published = $1';
    let params = [isPublished];
    let paramIndex = 2;

    if (authorId) {
      whereClause += ` AND p.author_id = $${paramIndex}`;
      params.push(authorId);
      paramIndex++;
    }

    if (communityId) {
      whereClause += ` AND p.community_id = $${paramIndex}`;
      params.push(communityId);
      paramIndex++;
    }

    if (category) {
      whereClause += ` AND p.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    const query = `
      SELECT 
        p.id, p.title, p.content, p.category, p.image_url, p.image_key,
        p.created_at, p.updated_at, p.likes_count, p.comments_count,
        u.id as author_id, u.username as author_username, u.full_name as author_name,
        up.avatar_url as author_avatar,
        c.id as community_id, c.name as community_name, c.is_public as community_public
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN communities c ON p.community_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    return new Promise((resolve, reject) => {
      db.query(query, params, (err, result) => {
        if (err) return reject(err);
        resolve(result.rows);
      });
    });
  }

  // Optimized opportunities with creator info
  static async getOpportunitiesWithDetails(filters = {}, limit = 20, offset = 0) {
    const { category, location, createdBy, isActive = true } = filters;
    
    let whereClause = 'WHERE o.deadline > NOW()';
    let params = [];
    let paramIndex = 1;

    if (isActive) {
      whereClause += ' AND o.deadline > NOW()';
    }

    if (category) {
      whereClause += ` AND o.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (location) {
      whereClause += ` AND o.location = $${paramIndex}`;
      params.push(location);
      paramIndex++;
    }

    if (createdBy) {
      whereClause += ` AND o.created_by = $${paramIndex}`;
      params.push(createdBy);
      paramIndex++;
    }

    const query = `
      SELECT 
        o.id, o.title, o.description, o.category, o.location, o.duration,
        o.deadline, o.image_url, o.image_key, o.created_at, o.updated_at,
        u.id as creator_id, u.username as creator_username, u.full_name as creator_name,
        up.avatar_url as creator_avatar,
        COUNT(a.id) as application_count
      FROM opportunities o
      LEFT JOIN users u ON o.created_by = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN applications a ON o.id = a.opportunity_id
      ${whereClause}
      GROUP BY o.id, u.id, up.avatar_url
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    return new Promise((resolve, reject) => {
      db.query(query, params, (err, result) => {
        if (err) return reject(err);
        resolve(result.rows);
      });
    });
  }

  // Optimized communities with member counts and creator info
  static async getCommunitiesWithDetails(filters = {}, limit = 20, offset = 0) {
    const { isPublic, createdBy, hasMembers = false } = filters;
    
    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    if (isPublic !== undefined) {
      whereClause += `WHERE c.is_public = $${paramIndex}`;
      params.push(isPublic);
      paramIndex++;
    }

    if (createdBy) {
      whereClause += whereClause ? ` AND c.created_by = $${paramIndex}` : `WHERE c.created_by = $${paramIndex}`;
      params.push(createdBy);
      paramIndex++;
    }

    if (hasMembers) {
      whereClause += whereClause ? ` AND c.member_count > 0` : `WHERE c.member_count > 0`;
    }

    const query = `
      SELECT 
        c.id, c.name, c.description, c.is_public, c.member_count,
        c.created_at, c.updated_at,
        u.id as creator_id, u.username as creator_username, u.full_name as creator_name,
        up.avatar_url as creator_avatar
      FROM communities c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ${whereClause}
      ORDER BY c.member_count DESC, c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    return new Promise((resolve, reject) => {
      db.query(query, params, (err, result) => {
        if (err) return reject(err);
        resolve(result.rows);
      });
    });
  }

  // Optimized messages with sender info
  static async getMessagesWithDetails(conversationId, limit = 50, offset = 0) {
    const query = `
      SELECT 
        m.id, m.content, m.message_type, m.is_read, m.created_at,
        u.id as sender_id, u.username as sender_username, u.full_name as sender_name,
        up.avatar_url as sender_avatar
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    return new Promise((resolve, reject) => {
      db.query(query, [conversationId, limit, offset], (err, result) => {
        if (err) return reject(err);
        resolve(result.rows);
      });
    });
  }

  // Optimized applications with user and opportunity details
  static async getApplicationsWithDetails(filters = {}, limit = 20, offset = 0) {
    const { userId, opportunityId, status } = filters;
    
    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    if (userId) {
      whereClause += `WHERE a.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (opportunityId) {
      whereClause += whereClause ? ` AND a.opportunity_id = $${paramIndex}` : `WHERE a.opportunity_id = $${paramIndex}`;
      params.push(opportunityId);
      paramIndex++;
    }

    if (status) {
      whereClause += whereClause ? ` AND a.status = $${paramIndex}` : `WHERE a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const query = `
      SELECT 
        a.id, a.status, a.message, a.created_at, a.updated_at,
        u.id as user_id, u.username as user_username, u.full_name as user_name,
        up.avatar_url as user_avatar,
        o.id as opportunity_id, o.title as opportunity_title, o.category as opportunity_category
      FROM applications a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN opportunities o ON a.opportunity_id = o.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    return new Promise((resolve, reject) => {
      db.query(query, params, (err, result) => {
        if (err) return reject(err);
        resolve(result.rows);
      });
    });
  }

  // Batch operations to prevent N+1 queries
  static async batchGetUserProfiles(userIds) {
    if (!userIds || userIds.length === 0) return [];
    
    const query = `
      SELECT user_id, bio, location, field, avatar_url
      FROM user_profiles
      WHERE user_id = ANY($1)
    `;

    return new Promise((resolve, reject) => {
      db.query(query, [userIds], (err, result) => {
        if (err) return reject(err);
        resolve(result.rows);
      });
    });
  }

  static async batchGetUserSettings(userIds) {
    if (!userIds || userIds.length === 0) return [];
    
    const query = `
      SELECT user_id, photo_upload_restriction, allowed_photo_sources
      FROM user_settings
      WHERE user_id = ANY($1)
    `;

    return new Promise((resolve, reject) => {
      db.query(query, [userIds], (err, result) => {
        if (err) return reject(err);
        resolve(result.rows);
      });
    });
  }

  // Search optimization with full-text search
  static async searchPosts(searchTerm, limit = 20, offset = 0) {
    const query = `
      SELECT 
        p.id, p.title, p.content, p.category, p.created_at,
        u.username as author_username, u.full_name as author_name,
        c.name as community_name,
        ts_rank(to_tsvector('english', p.title || ' ' || p.content), plainto_tsquery('english', $1)) as rank
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      WHERE to_tsvector('english', p.title || ' ' || p.content) @@ plainto_tsquery('english', $1)
        AND p.is_published = true
      ORDER BY rank DESC, p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    return new Promise((resolve, reject) => {
      db.query(query, [searchTerm, limit, offset], (err, result) => {
        if (err) return reject(err);
        resolve(result.rows);
      });
    });
  }

  static async searchOpportunities(searchTerm, limit = 20, offset = 0) {
    const query = `
      SELECT 
        o.id, o.title, o.description, o.category, o.location, o.deadline,
        u.username as creator_username, u.full_name as creator_name,
        ts_rank(to_tsvector('english', o.title || ' ' || o.description), plainto_tsquery('english', $1)) as rank
      FROM opportunities o
      LEFT JOIN users u ON o.created_by = u.id
      WHERE to_tsvector('english', o.title || ' ' || o.description) @@ plainto_tsquery('english', $1)
        AND o.deadline > NOW()
      ORDER BY rank DESC, o.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    return new Promise((resolve, reject) => {
      db.query(query, [searchTerm, limit, offset], (err, result) => {
        if (err) return reject(err);
        resolve(result.rows);
      });
    });
  }
}

module.exports = QueryOptimizer;
