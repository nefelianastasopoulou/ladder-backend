/**
 * User Service
 * Handles user-related business logic
 */

const bcrypt = require('bcryptjs');
const { NotFoundError, ConflictError, ValidationError } = require('../middleware/errorHandler');
const { formatUserData } = require('../utils/response');
const logger = require('../utils/logger');

class UserService {
  constructor(db) {
    this.db = db;
  }

  // Create a new user
  async createUser(userData) {
    const { email, password, full_name, username } = userData;

    // Note: Email uniqueness check removed - multiple users can have the same email

    const existingUsername = await this.getUserByUsername(username);
    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const query = `
      INSERT INTO users (email, password, full_name, username, is_admin, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, email, full_name, username, is_admin, created_at
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [email, hashedPassword, full_name, username, false], (err, result) => {
        if (err) {
          logger.error('Error creating user', { error: err.message, email });
          reject(err);
        } else {
          const user = result.rows[0];
          logger.info('User created successfully', { userId: user.id, email: user.email });
          resolve(formatUserData(user));
        }
      });
    });
  }

  // Get user by ID
  async getUserById(userId) {
    const query = 'SELECT * FROM users WHERE id = $1';
    
    return new Promise((resolve, reject) => {
      this.db.query(query, [userId], (err, result) => {
        if (err) {
          logger.error('Error fetching user by ID', { error: err.message, userId });
          reject(err);
        } else if (result.rows.length === 0) {
          reject(new NotFoundError('User'));
        } else {
          resolve(result.rows[0]);
        }
      });
    });
  }

  // Get user by email
  async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    
    return new Promise((resolve, reject) => {
      this.db.query(query, [email], (err, result) => {
        if (err) {
          logger.error('Error fetching user by email', { error: err.message, email });
          reject(err);
        } else {
          resolve(result.rows[0] || null);
        }
      });
    });
  }

  // Get user by username
  async getUserByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    
    return new Promise((resolve, reject) => {
      this.db.query(query, [username], (err, result) => {
        if (err) {
          logger.error('Error fetching user by username', { error: err.message, username });
          reject(err);
        } else {
          resolve(result.rows[0] || null);
        }
      });
    });
  }

  // Authenticate user
  async authenticateUser(email, password) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new ValidationError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new ValidationError('Invalid email or password');
    }

    // Update last login
    await this.updateLastLogin(user.id);

    return formatUserData(user);
  }

  // Update user profile
  async updateUser(userId, updateData) {
    const allowedFields = ['full_name', 'username', 'bio', 'location', 'website'];
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

    // Check username uniqueness if username is being updated
    if (updateData.username) {
      const existingUser = await this.getUserByUsername(updateData.username);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError('Username already taken');
      }
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, full_name, username, bio, location, website, updated_at
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, values, (err, result) => {
        if (err) {
          logger.error('Error updating user', { error: err.message, userId });
          reject(err);
        } else if (result.rows.length === 0) {
          reject(new NotFoundError('User'));
        } else {
          logger.info('User updated successfully', { userId });
          resolve(formatUserData(result.rows[0]));
        }
      });
    });
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.getUserById(userId);
    
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new ValidationError('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const query = 'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2';

    return new Promise((resolve, reject) => {
      this.db.query(query, [hashedPassword, userId], (err, result) => {
        if (err) {
          logger.error('Error changing password', { error: err.message, userId });
          reject(err);
        } else {
          logger.info('Password changed successfully', { userId });
          resolve({ message: 'Password changed successfully' });
        }
      });
    });
  }

  // Update last login
  async updateLastLogin(userId) {
    const query = 'UPDATE users SET last_login = NOW() WHERE id = $1';

    return new Promise((resolve, reject) => {
      this.db.query(query, [userId], (err) => {
        if (err) {
          logger.error('Error updating last login', { error: err.message, userId });
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Get all users (admin only)
  async getAllUsers(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT id, email, full_name, username, is_admin, created_at, last_login
      FROM users 
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, [limit, offset], (err, result) => {
        if (err) {
          logger.error('Error fetching all users', { error: err.message });
          reject(err);
        } else {
          const users = result.rows.map(user => formatUserData(user, true));
          resolve(users);
        }
      });
    });
  }

  // Delete user (admin only)
  async deleteUser(userId) {
    const query = 'DELETE FROM users WHERE id = $1';

    return new Promise((resolve, reject) => {
      this.db.query(query, [userId], (err, result) => {
        if (err) {
          logger.error('Error deleting user', { error: err.message, userId });
          reject(err);
        } else if (result.rowCount === 0) {
          reject(new NotFoundError('User'));
        } else {
          logger.info('User deleted successfully', { userId });
          resolve({ message: 'User deleted successfully' });
        }
      });
    });
  }

  // Search users
  async searchUsers(query, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const searchQuery = `
      SELECT id, email, full_name, username, is_admin, created_at
      FROM users 
      WHERE full_name ILIKE $1 OR username ILIKE $1 OR email ILIKE $1
      ORDER BY full_name ASC
      LIMIT $2 OFFSET $3
    `;

    return new Promise((resolve, reject) => {
      this.db.query(searchQuery, [`%${query}%`, limit, offset], (err, result) => {
        if (err) {
          logger.error('Error searching users', { error: err.message, query });
          reject(err);
        } else {
          const users = result.rows.map(user => formatUserData(user));
          resolve(users);
        }
      });
    });
  }
}

module.exports = UserService;
