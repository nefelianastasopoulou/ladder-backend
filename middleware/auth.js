/**
 * Authentication and Authorization Middleware
 * Provides JWT token validation and role-based access control
 */

const jwt = require('jsonwebtoken');
const { AuthenticationError, AuthorizationError, NotFoundError } = require('./errorHandler');
const { sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// JWT token validation middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return next(new AuthenticationError('Access token required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      is_admin: decoded.is_admin || false
    };

    logger.debug('Token validated', {
      userId: req.user.id,
      email: req.user.email
    });

    next();
  } catch (error) {
    logger.warn('Token validation failed', {
      error: error.message,
      token: token.substring(0, 20) + '...'
    });

    if (error.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token expired'));
    } else if (error.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Invalid token'));
    } else {
      return next(new AuthenticationError('Token validation failed'));
    }
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      is_admin: decoded.is_admin || false
    };
  } catch (error) {
    // Don't fail for optional auth, just set user to null
    req.user = null;
  }

  next();
};

// Admin role requirement middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  if (!req.user.is_admin) {
    logger.warn('Admin access denied', {
      userId: req.user.id,
      email: req.user.email,
      attemptedAction: req.originalUrl
    });
    return next(new AuthorizationError('Admin privileges required'));
  }

  next();
};

// User ownership or admin middleware
const requireOwnershipOrAdmin = (userIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    const targetUserId = parseInt(req.params[userIdParam]);
    const currentUserId = req.user.id;

    if (req.user.is_admin || currentUserId === targetUserId) {
      return next();
    }

    logger.warn('Access denied - not owner or admin', {
      currentUserId,
      targetUserId,
      isAdmin: req.user.is_admin,
      attemptedAction: req.originalUrl
    });

    return next(new AuthorizationError('Access denied - insufficient permissions'));
  };
};

// Community membership middleware
const requireCommunityMembership = (req, res, next) => {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  const communityId = req.params.id || req.params.community_id;
  
  if (!communityId) {
    return next(new Error('Community ID required'));
  }

  // This would need to be implemented with actual database check
  // For now, we'll assume the route handler will check membership
  next();
};

// Rate limiting for authentication endpoints
const authRateLimit = (req, res, next) => {
  // This would integrate with express-rate-limit
  // For now, we'll just pass through
  next();
};

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    is_admin: user.is_admin || false
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'ladder-backend',
    audience: process.env.JWT_AUDIENCE || 'ladder-app'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

// Verify JWT token (utility function)
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AuthenticationError(`Token verification failed: ${error.message}`);
  }
};

// Extract token from request
const extractToken = (req) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

// Check if user has permission for resource
const hasPermission = (user, resource, action) => {
  // Admin has all permissions
  if (user.is_admin) {
    return true;
  }

  // Owner has all permissions for their resources
  if (resource.owner_id === user.id) {
    return true;
  }

  // Define specific permissions
  const permissions = {
    post: {
      read: true, // Anyone can read posts
      create: true, // Authenticated users can create posts
      update: false, // Only owner or admin
      delete: false // Only owner or admin
    },
    community: {
      read: true,
      create: true,
      update: false,
      delete: false
    },
    user: {
      read: true,
      update: false, // Only self
      delete: false // Only admin
    }
  };

  return permissions[resource.type]?.[action] || false;
};

// Permission middleware factory
const requirePermission = (resourceType, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    // This would need to be implemented with actual resource checking
    // For now, we'll pass through and let route handlers implement specific logic
    next();
  };
};

module.exports = {
  // Middleware
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireOwnershipOrAdmin,
  requireCommunityMembership,
  requirePermission,
  authRateLimit,
  
  // Utilities
  generateToken,
  verifyToken,
  extractToken,
  hasPermission
};
