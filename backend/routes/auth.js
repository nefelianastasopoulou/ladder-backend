/**
 * Authentication Routes
 * Handles user registration, login, and authentication
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { generateToken, authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const db = require('../database');

const router = express.Router();

/**
 * User Registration
 * POST /api/auth/register
 * POST /api/auth/signup (alias for frontend compatibility)
 */
router.post('/register', validate(schemas.user.signup), async (req, res) => {
  try {
    const { email, password, full_name, username } = req.body;

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return sendErrorResponse(res, 409, 'User with this email or username already exists');
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await db.query(
      `INSERT INTO users (email, password, full_name, username, role, is_active, created_at)
       VALUES ($1, $2, $3, $4, 'user', true, NOW())
       RETURNING id, email, username, full_name, role, created_at`,
      [email, hashedPassword, full_name, username]
    );

    const user = newUser.rows[0];

    // Generate JWT token
    const token = generateToken(user.id);

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      username: user.username,
      ip: req.ip
    });

    sendSuccessResponse(res, 201, 'User registered successfully', {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        createdAt: user.created_at
      },
      token
    });

  } catch (error) {
    logger.error('User registration failed:', error);
    sendErrorResponse(res, 500, 'Registration failed');
  }
});

/**
 * User Login
 * POST /api/auth/login
 * POST /api/auth/signin (alias for frontend compatibility)
 */
router.post('/login', validate(schemas.user.signin), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await db.query(
      'SELECT id, email, username, full_name, password, role, is_active, created_at FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      logger.warn('Login attempt with non-existent email', {
        email,
        ip: req.ip
      });
      return sendErrorResponse(res, 401, 'Invalid email or password');
    }

    const userData = user.rows[0];

    // Check if user is active
    if (!userData.is_active) {
      logger.warn('Login attempt with inactive account', {
        userId: userData.id,
        email: userData.email,
        ip: req.ip
      });
      return sendErrorResponse(res, 401, 'Account is inactive');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password);

    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password', {
        userId: userData.id,
        email: userData.email,
        ip: req.ip
      });
      return sendErrorResponse(res, 401, 'Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(userData.id);

    logger.info('User logged in successfully', {
      userId: userData.id,
      email: userData.email,
      username: userData.username,
      ip: req.ip
    });

    sendSuccessResponse(res, 200, 'Login successful', {
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        fullName: userData.full_name,
        role: userData.role,
        createdAt: userData.created_at
      },
      token
    });

  } catch (error) {
    logger.error('User login failed:', error);
    sendErrorResponse(res, 500, 'Login failed');
  }
});

/**
 * Get Current User Profile
 * GET /api/auth/me
 */
router.get('/me', async (req, res) => {
  try {
    // This route should be protected by authenticateToken middleware
    // The user will be available in req.user
    if (!req.user) {
      return sendErrorResponse(res, 401, 'Authentication required');
    }

    sendSuccessResponse(res, 200, 'User profile retrieved', {
      user: req.user
    });

  } catch (error) {
    logger.error('Get user profile failed:', error);
    sendErrorResponse(res, 500, 'Failed to retrieve user profile');
  }
});

/**
 * Change Password
 * PUT /api/auth/change-password
 */
router.put('/change-password', validate(schemas.user.changePassword), async (req, res) => {
  try {
    if (!req.user) {
      return sendErrorResponse(res, 401, 'Authentication required');
    }

    const { current_password, new_password } = req.body;

    // Get current password hash
    const user = await db.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.rows[0].password);

    if (!isValidPassword) {
      logger.warn('Password change attempt with invalid current password', {
        userId: req.user.id,
        ip: req.ip
      });
      return sendErrorResponse(res, 401, 'Current password is incorrect');
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await db.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    logger.info('User changed password successfully', {
      userId: req.user.id,
      email: req.user.email,
      ip: req.ip
    });

    sendSuccessResponse(res, 200, 'Password changed successfully');

  } catch (error) {
    logger.error('Password change failed:', error);
    sendErrorResponse(res, 500, 'Password change failed');
  }
});

/**
 * Change Email
 * PUT /api/auth/change-email
 */
router.put('/change-email', validate(schemas.user.changeEmail), async (req, res) => {
  try {
    if (!req.user) {
      return sendErrorResponse(res, 401, 'Authentication required');
    }

    const { new_email } = req.body;

    // Check if email is already taken
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [new_email, req.user.id]
    );

    if (existingUser.rows.length > 0) {
      return sendErrorResponse(res, 409, 'Email is already taken');
    }

    // Update email
    await db.query(
      'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2',
      [new_email, req.user.id]
    );

    logger.info('User changed email successfully', {
      userId: req.user.id,
      oldEmail: req.user.email,
      newEmail: new_email,
      ip: req.ip
    });

    sendSuccessResponse(res, 200, 'Email changed successfully', {
      newEmail: new_email
    });

  } catch (error) {
    logger.error('Email change failed:', error);
    sendErrorResponse(res, 500, 'Email change failed');
  }
});

/**
 * Logout (client-side token removal)
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res) => {
  try {
    if (req.user) {
      logger.info('User logged out', {
        userId: req.user.id,
        email: req.user.email,
        ip: req.ip
      });
    }

    sendSuccessResponse(res, 200, 'Logged out successfully');

  } catch (error) {
    logger.error('Logout failed:', error);
    sendErrorResponse(res, 500, 'Logout failed');
  }
});

// Frontend compatibility aliases
router.post('/signup', validate(schemas.user.signup), async (req, res) => {
  try {
    const { email, password, full_name, username } = req.body;

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return sendErrorResponse(res, 409, 'User with this email or username already exists');
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await db.query(
      `INSERT INTO users (email, password, full_name, username, role, is_active, created_at)
       VALUES ($1, $2, $3, $4, 'user', true, NOW())
       RETURNING id, email, username, full_name, role, created_at`,
      [email, hashedPassword, full_name, username]
    );

    const user = newUser.rows[0];

    // Generate JWT token
    const token = generateToken(user.id);

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      username: user.username,
      ip: req.ip
    });

    sendSuccessResponse(res, 201, 'User registered successfully', {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at
      },
      token: token
    });

  } catch (error) {
    logger.error('User registration failed:', error);
    sendErrorResponse(res, 500, 'Registration failed');
  }
});

router.post('/signin', validate(schemas.user.signin), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await db.query(
      'SELECT id, email, username, full_name, password, role, is_active, created_at FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      logger.warn('Login attempt with non-existent email', {
        email: email,
        ip: req.ip
      });
      return sendErrorResponse(res, 401, 'Invalid email or password');
    }

    const userData = user.rows[0];

    // Check if user is active
    if (!userData.is_active) {
      logger.warn('Login attempt with inactive account', {
        userId: userData.id,
        email: userData.email,
        ip: req.ip
      });
      return sendErrorResponse(res, 401, 'Account is inactive');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password);

    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password', {
        userId: userData.id,
        email: userData.email,
        ip: req.ip
      });
      return sendErrorResponse(res, 401, 'Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(userData.id);

    logger.info('User logged in successfully', {
      userId: userData.id,
      email: userData.email,
      username: userData.username,
      ip: req.ip
    });

    sendSuccessResponse(res, 200, 'Login successful', {
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        full_name: userData.full_name,
        role: userData.role,
        created_at: userData.created_at
      },
      token: token
    });

  } catch (error) {
    logger.error('User login failed:', error);
    sendErrorResponse(res, 500, 'Login failed');
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendErrorResponse(res, 400, 'Email is required');
    }

    // Check if user exists
    const user = await db.query(
      'SELECT id, email, username FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      // Don't reveal if email exists or not for security
      return sendSuccessResponse(res, 200, 'If the email exists, a password reset link has been sent');
    }

    // Generate reset token (in a real app, you'd send an email)
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token
    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.rows[0].id, resetToken, expiresAt]
    );

    logger.info('Password reset token generated', {
      userId: user.rows[0].id,
      email: user.rows[0].email,
      ip: req.ip
    });

    // In a real app, you would send an email here
    sendSuccessResponse(res, 200, 'If the email exists, a password reset link has been sent', {
      resetToken: resetToken // Only for development/testing
    });

  } catch (error) {
    logger.error('Forgot password failed:', error);
    sendErrorResponse(res, 500, 'Failed to process password reset request');
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return sendErrorResponse(res, 400, 'Token and new password are required');
    }

    // Find valid reset token
    const resetToken = await db.query(
      'SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (resetToken.rows.length === 0) {
      return sendErrorResponse(res, 400, 'Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await db.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, resetToken.rows[0].user_id]
    );

    // Delete used reset token
    await db.query(
      'DELETE FROM password_reset_tokens WHERE token = $1',
      [token]
    );

    logger.info('Password reset successfully', {
      userId: resetToken.rows[0].user_id,
      ip: req.ip
    });

    sendSuccessResponse(res, 200, 'Password reset successfully');

  } catch (error) {
    logger.error('Password reset failed:', error);
    sendErrorResponse(res, 500, 'Failed to reset password');
  }
});

// Change email
router.put('/change-email', authenticateToken, async (req, res) => {
  try {
    const { new_email } = req.body;

    if (!new_email) {
      return sendErrorResponse(res, 400, 'New email is required');
    }

    // Check if new email is already taken
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [new_email]
    );

    if (existingUser.rows.length > 0) {
      return sendErrorResponse(res, 409, 'Email is already taken');
    }

    // Generate email change token
    const changeToken = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Store email change request
    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [req.user.id, changeToken, expiresAt]
    );

    // Update user with pending email (in a real app, you'd send verification email)
    await db.query(
      'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2',
      [new_email, req.user.id]
    );

    logger.info('Email change initiated', {
      userId: req.user.id,
      newEmail: new_email,
      ip: req.ip
    });

    sendSuccessResponse(res, 200, 'Email change initiated. Please check your new email for verification', {
      changeToken: changeToken // Only for development/testing
    });

  } catch (error) {
    logger.error('Email change failed:', error);
    sendErrorResponse(res, 500, 'Failed to change email');
  }
});

// Verify email change
router.post('/verify-email-change', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return sendErrorResponse(res, 400, 'Verification token is required');
    }

    // Find valid change token
    const changeToken = await db.query(
      'SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (changeToken.rows.length === 0) {
      return sendErrorResponse(res, 400, 'Invalid or expired verification token');
    }

    // Delete used token
    await db.query(
      'DELETE FROM password_reset_tokens WHERE token = $1',
      [token]
    );

    logger.info('Email change verified', {
      userId: changeToken.rows[0].user_id,
      ip: req.ip
    });

    sendSuccessResponse(res, 200, 'Email change verified successfully');

  } catch (error) {
    logger.error('Email change verification failed:', error);
    sendErrorResponse(res, 500, 'Failed to verify email change');
  }
});

// Delete account
router.delete('/delete-account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return sendErrorResponse(res, 400, 'Password is required to delete account');
    }

    // Verify password
    const user = await db.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    const isValidPassword = await bcrypt.compare(password, user.rows[0].password);

    if (!isValidPassword) {
      return sendErrorResponse(res, 401, 'Invalid password');
    }

    // Delete user (cascade will handle related records)
    await db.query(
      'DELETE FROM users WHERE id = $1',
      [req.user.id]
    );

    logger.info('Account deleted', {
      userId: req.user.id,
      ip: req.ip
    });

    sendSuccessResponse(res, 200, 'Account deleted successfully');

  } catch (error) {
    logger.error('Account deletion failed:', error);
    sendErrorResponse(res, 500, 'Failed to delete account');
  }
});

// Make user admin (for existing admin users)
router.post('/make-admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return sendErrorResponse(res, 400, 'user_id is required');
    }

    // Check if user exists
    const user = await db.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [user_id]
    );

    if (user.rows.length === 0) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    // Make user admin
    await db.query(
      'UPDATE users SET is_admin = true, role = $1, updated_at = NOW() WHERE id = $2',
      ['admin', user_id]
    );

    logger.info('User promoted to admin', {
      adminUserId: req.user.id,
      promotedUserId: user_id,
      ip: req.ip
    });

    sendSuccessResponse(res, 200, 'User promoted to admin successfully', {
      user: {
        id: user.rows[0].id,
        username: user.rows[0].username,
        email: user.rows[0].email,
        is_admin: true,
        role: 'admin'
      }
    });

  } catch (error) {
    logger.error('Make admin failed:', error);
    sendErrorResponse(res, 500, 'Failed to promote user to admin');
  }
});

module.exports = router;