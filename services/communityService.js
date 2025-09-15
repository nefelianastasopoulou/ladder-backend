/**
 * Community Service
 * Handles community-related business logic
 */

const { NotFoundError, ConflictError, ValidationError } = require('../middleware/errorHandler');
const { formatCommunityData } = require('../utils/response');
const logger = require('../utils/logger');

class CommunityService {
  constructor(db) {
    this.db = db;
  }

  // Create a new community
  async createCommunity(communityData, creatorId) {
    const { name, description, category } = communityData;

    // Check if community name already exists
    const existingCommunity = await this.getCommunityByName(name);
    if (existingCommunity) {
      throw new ConflictError('Community name already exists');
    }

    const query = `
      INSERT INTO communities (name, description, category, created_by, member_count, is_public, created_at)
      VALUES ($1, $2, $3, $4, 1, true, NOW())
      RETURNING id, name, description, category, created_by, member_count, is_public, created_at
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [name, description, category || '', creatorId], (err, result) => {
        if (err) {
          logger.error('Error creating community', { error: err.message, name, creatorId });
          reject(err);
        } else {
          const community = result.rows[0];
          
          // Add creator as first member
          this.addMember(community.id, creatorId, 'admin')
            .then(() => {
              logger.info('Community created successfully', { 
                communityId: community.id, 
                name: community.name, 
                creatorId 
              });
              resolve(formatCommunityData(community));
            })
            .catch(reject);
        }
      });
    });
  }

  // Get community by ID
  async getCommunityById(communityId) {
    const query = `
      SELECT c.*, u.full_name as creator_name, u.username as creator_username
      FROM communities c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = $1
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [communityId], (err, result) => {
        if (err) {
          logger.error('Error fetching community by ID', { error: err.message, communityId });
          reject(err);
        } else if (result.rows.length === 0) {
          reject(new NotFoundError('Community'));
        } else {
          resolve(result.rows[0]);
        }
      });
    });
  }

  // Get community by name
  async getCommunityByName(name) {
    const query = 'SELECT * FROM communities WHERE name = $1';

    return new Promise((resolve, reject) => {
      this.db.query(query, [name], (err, result) => {
        if (err) {
          logger.error('Error fetching community by name', { error: err.message, name });
          reject(err);
        } else {
          resolve(result.rows[0] || null);
        }
      });
    });
  }

  // Get all communities
  async getAllCommunities(page = 1, limit = 10, category = null) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT c.*, u.full_name as creator_name, u.username as creator_username
      FROM communities c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.is_public = true
    `;
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND c.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    return new Promise((resolve, reject) => {
      this.db.query(query, params, (err, result) => {
        if (err) {
          logger.error('Error fetching communities', { error: err.message });
          reject(err);
        } else {
          const communities = result.rows.map(community => formatCommunityData(community));
          resolve(communities);
        }
      });
    });
  }

  // Update community
  async updateCommunity(communityId, updateData, userId) {
    const community = await this.getCommunityById(communityId);
    
    // Check if user is the creator or admin
    if (community.created_by !== userId) {
      const isAdmin = await this.isUserAdmin(communityId, userId);
      if (!isAdmin) {
        throw new ValidationError('Only community creators and admins can update community');
      }
    }

    const allowedFields = ['name', 'description', 'category'];
    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [field, value] of Object.entries(updateData)) {
      if (allowedFields.includes(field) && value !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    // Check name uniqueness if name is being updated
    if (updateData.name) {
      const existingCommunity = await this.getCommunityByName(updateData.name);
      if (existingCommunity && existingCommunity.id !== communityId) {
        throw new ConflictError('Community name already exists');
      }
    }

    updates.push(`updated_at = NOW()`);
    values.push(communityId);

    const query = `
      UPDATE communities 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, description, category, updated_at
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, values, (err, result) => {
        if (err) {
          logger.error('Error updating community', { error: err.message, communityId });
          reject(err);
        } else if (result.rows.length === 0) {
          reject(new NotFoundError('Community'));
        } else {
          logger.info('Community updated successfully', { communityId });
          resolve(formatCommunityData(result.rows[0]));
        }
      });
    });
  }

  // Delete community
  async deleteCommunity(communityId, userId) {
    const community = await this.getCommunityById(communityId);
    
    // Only creator can delete community
    if (community.created_by !== userId) {
      throw new ValidationError('Only community creator can delete community');
    }

    const query = 'DELETE FROM communities WHERE id = $1';

    return new Promise((resolve, reject) => {
      this.db.query(query, [communityId], (err, result) => {
        if (err) {
          logger.error('Error deleting community', { error: err.message, communityId });
          reject(err);
        } else if (result.rowCount === 0) {
          reject(new NotFoundError('Community'));
        } else {
          logger.info('Community deleted successfully', { communityId });
          resolve({ message: 'Community deleted successfully' });
        }
      });
    });
  }

  // Add member to community
  async addMember(communityId, userId, role = 'member') {
    // Check if user is already a member
    const existingMember = await this.getMember(communityId, userId);
    if (existingMember) {
      throw new ConflictError('User is already a member of this community');
    }

    const query = `
      INSERT INTO community_members (community_id, user_id, role, joined_at)
      VALUES ($1, $2, $3, NOW())
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [communityId, userId, role], (err) => {
        if (err) {
          logger.error('Error adding member to community', { 
            error: err.message, 
            communityId, 
            userId 
          });
          reject(err);
        } else {
          // Update member count
          this.updateMemberCount(communityId);
          logger.info('Member added to community', { communityId, userId, role });
          resolve({ message: 'Member added successfully' });
        }
      });
    });
  }

  // Remove member from community
  async removeMember(communityId, userId) {
    const query = 'DELETE FROM community_members WHERE community_id = $1 AND user_id = $2';

    return new Promise((resolve, reject) => {
      this.db.query(query, [communityId, userId], (err, result) => {
        if (err) {
          logger.error('Error removing member from community', { 
            error: err.message, 
            communityId, 
            userId 
          });
          reject(err);
        } else if (result.rowCount === 0) {
          reject(new NotFoundError('Community membership'));
        } else {
          // Update member count
          this.updateMemberCount(communityId);
          logger.info('Member removed from community', { communityId, userId });
          resolve({ message: 'Member removed successfully' });
        }
      });
    });
  }

  // Get community members
  async getCommunityMembers(communityId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT u.id, u.full_name, u.username, u.email, cm.role, cm.joined_at
      FROM community_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.community_id = $1
      ORDER BY cm.joined_at ASC
      LIMIT $2 OFFSET $3
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [communityId, limit, offset], (err, result) => {
        if (err) {
          logger.error('Error fetching community members', { 
            error: err.message, 
            communityId 
          });
          reject(err);
        } else {
          resolve(result.rows);
        }
      });
    });
  }

  // Get user's communities
  async getUserCommunities(userId) {
    const query = `
      SELECT c.*, cm.role, cm.joined_at
      FROM communities c
      JOIN community_members cm ON c.id = cm.community_id
      WHERE cm.user_id = $1
      ORDER BY cm.joined_at DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [userId], (err, result) => {
        if (err) {
          logger.error('Error fetching user communities', { 
            error: err.message, 
            userId 
          });
          reject(err);
        } else {
          const communities = result.rows.map(row => ({
            ...formatCommunityData(row),
            role: row.role,
            joined_at: row.joined_at
          }));
          resolve(communities);
        }
      });
    });
  }

  // Check if user is member of community
  async isMember(communityId, userId) {
    const member = await this.getMember(communityId, userId);
    return member !== null;
  }

  // Check if user is admin of community
  async isUserAdmin(communityId, userId) {
    const member = await this.getMember(communityId, userId);
    return member && member.role === 'admin';
  }

  // Get member info
  async getMember(communityId, userId) {
    const query = 'SELECT * FROM community_members WHERE community_id = $1 AND user_id = $2';

    return new Promise((resolve, reject) => {
      this.db.query(query, [communityId, userId], (err, result) => {
        if (err) {
          logger.error('Error fetching member', { 
            error: err.message, 
            communityId, 
            userId 
          });
          reject(err);
        } else {
          resolve(result.rows[0] || null);
        }
      });
    });
  }

  // Update member count
  async updateMemberCount(communityId) {
    const query = `
      UPDATE communities 
      SET member_count = (
        SELECT COUNT(*) FROM community_members WHERE community_id = $1
      )
      WHERE id = $1
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [communityId], (err) => {
        if (err) {
          logger.error('Error updating member count', { 
            error: err.message, 
            communityId 
          });
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Search communities
  async searchCommunities(query, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const searchQuery = `
      SELECT c.*, u.full_name as creator_name, u.username as creator_username
      FROM communities c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.is_public = true 
      AND (c.name ILIKE $1 OR c.description ILIKE $1 OR c.category ILIKE $1)
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    return new Promise((resolve, reject) => {
      this.db.query(searchQuery, [`%${query}%`, limit, offset], (err, result) => {
        if (err) {
          logger.error('Error searching communities', { error: err.message, query });
          reject(err);
        } else {
          const communities = result.rows.map(community => formatCommunityData(community));
          resolve(communities);
        }
      });
    });
  }
}

module.exports = CommunityService;
