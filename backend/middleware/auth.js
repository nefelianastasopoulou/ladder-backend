/**
 * Authentication Middleware
 * Provides JWT token authentication and authorization
 */

const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const logger = require('../utils/logger');
const { sendAuthError, sendForbiddenError } = require('../utils/response');
const db = require('../database');

/**
 * Authenticate JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      return sendAuthError(res, 'Access token is required');
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE
    });

    // Get user from database
    const user = await db.query(
      'SELECT id, email, username, full_name, role, is_active, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!user.rows || user.rows.length === 0) {
      logger.warn('Authentication failed: User not found', {
        userId: decoded.userId,
        ip: req.ip,
        path: req.path
      });
      return sendAuthError(res, 'Invalid token: User not found');
    }

    const userData = user.rows[0];

    // Check if user is active
    if (!userData.is_active) {
      logger.warn('Authentication failed: User account is inactive', {
        userId: userData.id,
        email: userData.email,
        ip: req.ip,
        path: req.path
      });
      return sendAuthError(res, 'Account is inactive');
    }

    // Add user to request object
    req.user = {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      fullName: userData.full_name,
      role: userData.role || 'user',
      isAdmin: userData.role === 'admin',
      createdAt: userData.created_at
    };

    // Log successful authentication
    logger.info('User authenticated successfully', {
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      ip: req.ip,
      path: req.path
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Authentication failed: Invalid token', {
        error: error.message,
        ip: req.ip,
        path: req.path
      });
      return sendAuthError(res, 'Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      logger.warn('Authentication failed: Token expired', {
        expiredAt: error.expiredAt,
        ip: req.ip,
        path: req.path
      });
      return sendAuthError(res, 'Token has expired');
    } else if (error.name === 'NotBeforeError') {
      logger.warn('Authentication failed: Token not active', {
        notBefore: error.date,
        ip: req.ip,
        path: req.path
      });
      return sendAuthError(res, 'Token not yet active');
    } else {
      logger.error('Authentication error:', error);
      return sendAuthError(res, 'Authentication failed');
    }
  }
};

/**
 * Require admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    logger.warn('Authorization failed: No user in request', {
      ip: req.ip,
      path: req.path
    });
    return sendAuthError(res, 'Authentication required');
  }

  if (!req.user.isAdmin && req.user.role !== 'admin') {
    logger.warn('Authorization failed: Insufficient privileges', {
      userId: req.user.id,
      userRole: req.user.role,
      requiredRole: 'admin',
      ip: req.ip,
      path: req.path
    });
    return sendForbiddenError(res, 'Admin privileges required');
  }

  logger.info('Admin access granted', {
    userId: req.user.id,
    email: req.user.email,
    ip: req.ip,
    path: req.path
  });

  next();
};

/**
 * Require specific role
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Authorization failed: No user in request', {
        ip: req.ip,
        path: req.path
      });
      return sendAuthError(res, 'Authentication required');
    }

    if (req.user.role !== role) {
      logger.warn('Authorization failed: Insufficient privileges', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRole: role,
        ip: req.ip,
        path: req.path
      });
      return sendForbiddenError(res, `${role} privileges required`);
    }

    logger.info('Role-based access granted', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      path: req.path
    });

    next();
  };
};

/**
 * Require any of the specified roles
 */
const requireAnyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Authorization failed: No user in request', {
        ip: req.ip,
        path: req.path
      });
      return sendAuthError(res, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed: Insufficient privileges', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        ip: req.ip,
        path: req.path
      });
      return sendForbiddenError(res, `One of the following roles required: ${roles.join(', ')}`);
    }

    logger.info('Role-based access granted', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      allowedRoles: roles,
      ip: req.ip,
      path: req.path
    });

    next();
  };
};

/**
 * Optional authentication (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }

    // Try to authenticate, but don't fail if token is invalid
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE
    });

    const user = await db.query(
      'SELECT id, email, username, full_name, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (user.rows && user.rows.length > 0 && user.rows[0].is_active) {
      req.user = {
        id: user.rows[0].id,
        email: user.rows[0].email,
        username: user.rows[0].username,
        fullName: user.rows[0].full_name,
        role: user.rows[0].role || 'user',
        isAdmin: user.rows[0].role === 'admin'
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // Token is invalid, but we don't fail - just set user to null
    req.user = null;
    next();
  }
};

/**
 * Check if user owns resource
 */
const requireOwnership = (resourceIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return sendAuthError(res, 'Authentication required');
    }

    const resourceId = req.params[resourceIdParam];
    const userId = req.user.id;

    // Admin can access any resource
    if (req.user.isAdmin || req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    if (parseInt(resourceId) !== parseInt(userId)) {
      logger.warn('Authorization failed: User does not own resource', {
        userId: req.user.id,
        resourceId: resourceId,
        ip: req.ip,
        path: req.path
      });
      return sendForbiddenError(res, 'You can only access your own resources');
    }

    next();
  };
};

/**
 * Generate JWT token
 */
const generateToken = (userId, expiresIn = config.JWT_EXPIRES_IN) => {
  const payload = {
    userId: userId,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: expiresIn,
    issuer: config.JWT_ISSUER,
    audience: config.JWT_AUDIENCE
  });
};

/**
 * Verify JWT token (utility function)
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET, {
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE
    });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireRole,
  requireAnyRole,
  optionalAuth,
  requireOwnership,
  generateToken,
  verifyToken
};