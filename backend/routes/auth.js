/**
 * Authentication Routes
 * Handles user registration, login, and authentication
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { generateToken, authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const { sendPasswordResetEmail, isEmailConfigured } = require('../services/emailService');
const logger = require('../utils/logger');
const db = require('../database');
// Node.js v20+ has built-in fetch, no need to require node-fetch

const router = express.Router();

/**
 * User Registration
 * POST /api/auth/register
 * POST /api/auth/signup (alias for frontend compatibility)
 */
router.post('/register', validate(schemas.user.signup), async (req, res) => {
  try {
    const { email, password, full_name, username } = req.body;

    // Check if username already exists (email can be duplicated)
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return sendErrorResponse(res, 409, 'Username already exists');
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await db.query(
      `INSERT INTO users (email, password_hash, full_name, username, role, is_active, created_at)
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

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at
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

    // Find user by email OR username
    const user = await db.query(
      'SELECT id, email, username, full_name, password_hash, role, is_active, created_at FROM users WHERE email = $1 OR username = $1',
      [email]
    );

    if (user.rows.length === 0) {
      logger.warn('Login attempt with non-existent email/username', {
        email,
        ip: req.ip
      });
      return sendErrorResponse(res, 401, 'Invalid email/username or password');
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
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);

    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password_hash', {
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

    res.status(200).json({
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        full_name: userData.full_name,
        role: userData.role,
        created_at: userData.created_at
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

    // Get current password_hash hash
    const user = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.rows[0].password_hash);

    if (!isValidPassword) {
      logger.warn('Password change attempt with invalid current password_hash', {
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
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    logger.info('User changed password_hash successfully', {
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

    // Check if username already exists (email can be duplicated)
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return sendErrorResponse(res, 409, 'Username already exists');
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await db.query(
      `INSERT INTO users (email, password_hash, full_name, username, role, is_active, created_at)
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

    res.status(201).json({
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

    // Find user by email OR username
    const user = await db.query(
      'SELECT id, email, username, full_name, password_hash, role, is_active, created_at FROM users WHERE email = $1 OR username = $1',
      [email]
    );

    if (user.rows.length === 0) {
      logger.warn('Login attempt with non-existent email/username', {
        email: email,
        ip: req.ip
      });
      return sendErrorResponse(res, 401, 'Invalid email/username or password');
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
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);

    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password_hash', {
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

    res.status(200).json({
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

// Forgot password_hash
router.post('/forgot-password', validate(schemas.user.forgotPassword), async (req, res) => {
  try {
    const { email, username } = req.body;

    // Find user by both email AND username (username is unique, so this identifies the exact account)
    const userResult = await db.query(
      'SELECT id, email, username FROM users WHERE email = $1 AND username = $2',
      [email, username.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal if account exists or not for security
      return sendSuccessResponse(res, 200, 'If an account exists with this email and username, a password reset link has been sent');
    }

    const user = userResult.rows[0];

    // Generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token
    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, resetToken, expiresAt]
    );

    logger.info('Password reset token generated', {
      userId: user.id,
      email: user.email,
      username: user.username,
      ip: req.ip,
      token: resetToken.substring(0, 10) + '...' // Log partial token for debugging
    });

    // Send response immediately, don't wait for email
    sendSuccessResponse(res, 200, 'If the email exists, a password reset link has been sent');

    // Send email asynchronously (non-blocking)
    // This prevents the API from timing out if email sending takes time or fails
    setImmediate(async () => {
      try {
        // Check if email is configured before attempting to send
        if (!isEmailConfigured()) {
          logger.error('Email service not configured - cannot send password reset email', {
            userId: user.id,
            email: user.email,
            EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Missing',
            EMAIL_PASS: process.env.EMAIL_PASS ? 'Set' : 'Missing'
          });
          
          // In development mode, log the token so developers can test
          if (process.env.NODE_ENV !== 'production') {
            logger.warn('DEVELOPMENT MODE: Password reset token generated but email not sent', {
              userId: user.id,
              email: user.email,
              resetToken: resetToken,
              resetLink: `${process.env.FRONTEND_URL || 'ladder://'}reset-password?token=${resetToken}`
            });
          }
          return;
        }

        // Send password reset email (with timeout)
        logger.info('Attempting to send password reset email', {
          userId: user.id,
          email: user.email,
          emailUser: process.env.EMAIL_USER,
          emailDomain: process.env.EMAIL_USER?.split('@')[1] || 'unknown'
        });
        
        // Add timeout to email sending (15 seconds max)
        const emailPromise = sendPasswordResetEmail(user.email, resetToken);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Email sending timeout after 15 seconds')), 15000);
        });
        
        await Promise.race([emailPromise, timeoutPromise]);
        
          logger.info('Password reset email sent successfully', {
            userId: user.id,
            email: user.email
          });
        } catch (emailError) {
          // Log FULL error details including nested properties
          logger.error('Failed to send password reset email - DETAILED ERROR:', {
            userId: user.id,
            email: user.email,
            emailUser: process.env.EMAIL_USER,
            emailDomain: process.env.EMAIL_USER?.split('@')[1] || 'unknown',
          errorMessage: emailError.message,
          errorCode: emailError.code,
          errorCommand: emailError.command,
          errorResponse: emailError.response,
          errorResponseCode: emailError.responseCode,
          errorResponseMessage: emailError.responseMessage,
          errorStack: emailError.stack,
          fullError: JSON.stringify(emailError, Object.getOwnPropertyNames(emailError))
        });
        
        // Also log to console for immediate visibility in Railway logs
        console.error('❌ EMAIL SEND FAILED:', {
          message: emailError.message,
          code: emailError.code,
          command: emailError.command,
          response: emailError.response,
          responseCode: emailError.responseCode,
          responseMessage: emailError.responseMessage,
          emailUser: process.env.EMAIL_USER,
          emailDomain: process.env.EMAIL_USER?.split('@')[1] || 'unknown'
        });
        
          // In development mode, log the token so developers can test even if email fails
          if (process.env.NODE_ENV !== 'production') {
            logger.warn('DEVELOPMENT MODE: Password reset token (email failed but token available for testing)', {
              userId: user.id,
              email: user.email,
              resetToken: resetToken,
              resetLink: `${process.env.FRONTEND_URL || 'ladder://'}reset-password?token=${resetToken}`
            });
          }
      }
    });

  } catch (error) {
    logger.error('Forgot password_hash failed:', error);
    sendErrorResponse(res, 500, 'Failed to process password_hash reset request');
  }
});

// Reset password_hash
router.post('/reset-password', validate(schemas.user.resetPassword), async (req, res) => {
  try {
    const { token, new_password } = req.body;

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
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
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

    // Verify password_hash
    const user = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    const isValidPassword = await bcrypt.compare(password, user.rows[0].password_hash);

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
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
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
        role: 'admin'
      }
    });

  } catch (error) {
    logger.error('Make admin failed:', error);
    sendErrorResponse(res, 500, 'Failed to promote user to admin');
  }
});

/**
 * Google OAuth Authentication
 * POST /api/auth/google
 * Body: { id_token, access_token, email, name, picture }
 */
router.post('/google', async (req, res) => {
  try {
    const { id_token, access_token, email, name, picture } = req.body;

    if (!id_token && !access_token) {
      return sendErrorResponse(res, 400, 'Google token is required');
    }

    // Verify the Google token by fetching user info
    let googleUser;
    try {
      if (access_token) {
        // Use access token to get user info
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
        );
        
        if (!userInfoResponse.ok) {
          throw new Error('Failed to verify Google token');
        }
        
        googleUser = await userInfoResponse.json();
      } else if (id_token) {
        // Verify ID token (more secure)
        const tokenResponse = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`
        );
        
        if (!tokenResponse.ok) {
          throw new Error('Failed to verify Google ID token');
        }
        
        const tokenInfo = await tokenResponse.json();
        
        // Get user info using the verified token
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token || ''}`
        );
        
        if (userInfoResponse.ok) {
          googleUser = await userInfoResponse.json();
        } else {
          // Fallback to token info
          googleUser = {
            email: tokenInfo.email,
            name: tokenInfo.name,
            picture: tokenInfo.picture,
            id: tokenInfo.sub,
          };
        }
      }
    } catch (error) {
      logger.error('Google token verification failed:', error);
      return sendErrorResponse(res, 401, 'Invalid Google token');
    }

    if (!googleUser || !googleUser.email) {
      return sendErrorResponse(res, 400, 'Unable to retrieve user information from Google');
    }

    // Use provided email or Google email
    const userEmail = email || googleUser.email;
    const userName = name || googleUser.name || googleUser.email.split('@')[0];
    const userPicture = picture || googleUser.picture;

    // Check if user already exists
    let user = await db.query(
      'SELECT id, email, username, full_name, role, is_active, created_at FROM users WHERE email = $1',
      [userEmail]
    );

    if (user.rows.length > 0) {
      // User exists, log them in
      const userData = user.rows[0];

      if (!userData.is_active) {
        return sendErrorResponse(res, 401, 'Account is inactive');
      }

      // Update user picture if provided and different
      if (userPicture && userPicture !== userData.avatar_url) {
        await db.query(
          'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
          [userPicture, userData.id]
        );
      }

      // Generate JWT token
      const token = generateToken(userData.id);

      logger.info('User logged in with Google', {
        userId: userData.id,
        email: userData.email,
        username: userData.username,
        ip: req.ip
      });

      return res.status(200).json({
        user: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          full_name: userData.full_name,
          role: userData.role,
          created_at: userData.created_at
        },
        token
      });
    } else {
      // New user, create account
      // Generate a username from email if not provided
      const baseUsername = userName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
      let username = baseUsername;
      let usernameExists = true;
      let attempts = 0;

      // Ensure username is unique
      while (usernameExists && attempts < 10) {
        const existingUser = await db.query(
          'SELECT id FROM users WHERE username = $1',
          [username]
        );

        if (existingUser.rows.length === 0) {
          usernameExists = false;
        } else {
          username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
          attempts++;
        }
      }

      // Create new user (no password for OAuth users)
      const newUser = await db.query(
        `INSERT INTO users (email, password_hash, full_name, username, role, is_active, avatar_url, created_at)
         VALUES ($1, NULL, $2, $3, 'user', true, $4, NOW())
         RETURNING id, email, username, full_name, role, created_at`,
        [userEmail, userName, username, userPicture]
      );

      const createdUser = newUser.rows[0];

      // Generate JWT token
      const token = generateToken(createdUser.id);

      logger.info('User registered with Google', {
        userId: createdUser.id,
        email: createdUser.email,
        username: createdUser.username,
        ip: req.ip
      });

      return res.status(201).json({
        user: {
          id: createdUser.id,
          email: createdUser.email,
          username: createdUser.username,
          full_name: createdUser.full_name,
          role: createdUser.role,
          created_at: createdUser.created_at
        },
        token
      });
    }

  } catch (error) {
    logger.error('Google authentication failed:', error);
    sendErrorResponse(res, 500, 'Google authentication failed');
  }
});

/**
 * Test Email Configuration (for debugging)
 * GET /api/auth/test-email
 * Returns email configuration status
 */
router.get('/test-email', async (req, res) => {
  try {
    const emailConfig = {
      isConfigured: isEmailConfigured(),
      emailUser: process.env.EMAIL_USER ? 'Set' : 'Missing',
      emailPass: process.env.EMAIL_PASS ? 'Set' : 'Missing',
      emailDomain: process.env.EMAIL_USER?.split('@')[1] || 'N/A',
      frontendUrl: process.env.FRONTEND_URL || 'Not set',
      smtpHost: null,
      smtpPort: null
    };

    if (isEmailConfigured()) {
      try {
        // Determine SMTP config based on email domain
        const emailUser = process.env.EMAIL_USER || '';
        const emailDomain = emailUser.split('@')[1]?.toLowerCase() || '';
        
        if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
          emailConfig.smtpHost = process.env.SMTP_HOST;
          emailConfig.smtpPort = parseInt(process.env.SMTP_PORT, 10);
        } else if (emailDomain === 'gmail.com' || emailDomain.endsWith('.gmail.com')) {
          emailConfig.smtpHost = 'smtp.gmail.com';
          emailConfig.smtpPort = 587;
        } else if (emailDomain.includes('outlook') || emailDomain.includes('hotmail') || emailDomain.includes('live')) {
          emailConfig.smtpHost = 'smtp-mail.outlook.com';
          emailConfig.smtpPort = 587;
        } else {
          emailConfig.smtpHost = 'smtp.gmail.com'; // default
          emailConfig.smtpPort = 587;
        }
      } catch (e) {
        // Ignore
      }
    }

    sendSuccessResponse(res, 200, 'Email configuration status', emailConfig);
  } catch (error) {
    logger.error('Email test failed:', error);
    sendErrorResponse(res, 500, 'Failed to test email configuration');
  }
});

/**
 * Send Test Email (for debugging)
 * POST /api/auth/test-email-send
 * Body: { email: "test@example.com" }
 * Sends a test email to verify email service is working
 */
router.post('/test-email-send', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return sendErrorResponse(res, 400, 'Email address is required');
    }

    if (!isEmailConfigured()) {
      return sendErrorResponse(res, 400, 'Email service not configured. EMAIL_USER and EMAIL_PASS must be set.');
    }

    logger.info('Test email send requested', { email });

    // Generate a test token
    const testToken = require('crypto').randomBytes(32).toString('hex');
    
    try {
      await sendPasswordResetEmail(email, testToken);
      
      logger.info('Test email sent successfully', { email });
      sendSuccessResponse(res, 200, 'Test email sent successfully. Check your inbox (and spam folder).', {
        email,
        testToken: process.env.NODE_ENV !== 'production' ? testToken : undefined // Only show token in dev
      });
    } catch (emailError) {
      logger.error('Test email send failed', {
        email,
        error: emailError.message,
        code: emailError.code,
        response: emailError.response
      });
      
      sendErrorResponse(res, 500, 'Failed to send test email', {
        error: emailError.message,
        code: emailError.code,
        hint: emailError.code === 'EAUTH' ? 'Authentication failed. For Gmail, make sure you\'re using an App Password, not your regular password.' : undefined
      });
    }
  } catch (error) {
    logger.error('Test email endpoint failed:', error);
    sendErrorResponse(res, 500, 'Failed to process test email request');
  }
});

module.exports = router;