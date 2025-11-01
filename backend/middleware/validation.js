/**
 * Input Validation Middleware
 * Provides comprehensive input validation and sanitization
 */

const Joi = require('joi');
const { sendErrorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Common validation schemas
const schemas = {
  // User validation
  user: {
    signup: Joi.object({
      email: Joi.string().email().required().max(255).trim()
        .messages({
          'string.email': 'Please enter a valid email address',
          'string.max': 'Email address is too long (maximum 255 characters)',
          'any.required': 'Email address is required'
        }),
      password: Joi.string().min(8).max(128).required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .messages({
          'string.min': 'Password must be at least 8 characters long',
          'string.max': 'Password is too long (maximum 128 characters)',
          'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)',
          'any.required': 'Password is required'
        }),
      full_name: Joi.string().min(2).max(100).required().trim()
        .messages({
          'string.min': 'Full name must be at least 2 characters long',
          'string.max': 'Full name is too long (maximum 100 characters)',
          'any.required': 'Full name is required'
        }),
      username: Joi.string().alphanum().min(3).max(30).required().trim().lowercase()
        .messages({
          'string.alphanum': 'Username can only contain letters and numbers (no spaces, underscores, or special characters)',
          'string.min': 'Username must be at least 3 characters long',
          'string.max': 'Username is too long (maximum 30 characters)',
          'any.required': 'Username is required'
        })
    }),
    
    signin: Joi.object({
      email: Joi.string().required(), // Allow either email or username
      password: Joi.string().required()
    }),
    
    updateProfile: Joi.object({
      full_name: Joi.string().min(2).max(100).optional().trim(),
      username: Joi.string().alphanum().min(3).max(30).optional().lowercase(),
      bio: Joi.string().max(500).optional().trim(),
      location: Joi.string().max(100).optional().trim(),
      field: Joi.string().max(100).optional().trim(),
      avatar_url: Joi.string().uri().optional()
    }),
    
    changePassword: Joi.object({
      current_password: Joi.string().required(),
      new_password: Joi.string().min(8).max(128).required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .messages({
          'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
        })
    }),
    
    changeEmail: Joi.object({
      new_email: Joi.string().email().required().max(255)
    }),
    
    forgotPassword: Joi.object({
      email: Joi.string().email().required().max(255).trim()
        .messages({
          'string.email': 'Please enter a valid email address',
          'string.max': 'Email address is too long (maximum 255 characters)',
          'any.required': 'Email address is required'
        })
    }),
    
    resetPassword: Joi.object({
      token: Joi.string().required().trim()
        .messages({
          'any.required': 'Reset token is required'
        }),
      new_password: Joi.string().min(8).max(128).required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .messages({
          'string.min': 'Password must be at least 8 characters long',
          'string.max': 'Password is too long (maximum 128 characters)',
          'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)',
          'any.required': 'New password is required'
        })
    })
  },
  
  // Opportunity validation
  opportunity: {
    create: Joi.object({
      title: Joi.string().min(5).max(200).required().trim(),
      description: Joi.string().max(2000).optional().trim(),
      category: Joi.string().max(50).optional().trim(),
      location: Joi.string().max(100).optional().trim(),
      field: Joi.string().max(100).optional().trim(),
      image_url: Joi.string().uri().optional(),
      deadline: Joi.date().iso().optional(),
      requirements: Joi.string().max(1000).optional().trim(),
      contact_info: Joi.string().max(200).optional().trim(),
      application_url: Joi.string().uri().optional(),
      is_external_application: Joi.boolean().optional()
    }),
    
    update: Joi.object({
      title: Joi.string().min(5).max(200).optional().trim(),
      description: Joi.string().max(2000).optional().trim(),
      category: Joi.string().max(50).optional().trim(),
      location: Joi.string().max(100).optional().trim(),
      field: Joi.string().max(100).optional().trim(),
      image_url: Joi.string().uri().optional(),
      deadline: Joi.date().iso().optional(),
      requirements: Joi.string().max(1000).optional().trim(),
      contact_info: Joi.string().max(200).optional().trim(),
      application_url: Joi.string().uri().optional(),
      is_external_application: Joi.boolean().optional()
    })
  },
  
  // Community validation
  community: {
    create: Joi.object({
      name: Joi.string().min(3).max(100).required().trim(),
      description: Joi.string().max(500).optional().trim().allow(''),
      category: Joi.string().max(50).optional().trim(),
      is_public: Joi.boolean().optional()
    }),
    
    update: Joi.object({
      name: Joi.string().min(3).max(100).optional().trim(),
      description: Joi.string().max(500).optional().trim(),
      category: Joi.string().max(50).optional().trim(),
      is_public: Joi.boolean().optional()
    })
  },
  
  // Post validation
  post: {
    create: Joi.object({
      title: Joi.string().min(5).max(200).required().trim(),
      content: Joi.string().min(10).max(5000).required().trim(),
      image: Joi.string().optional() // For file uploads
    }),
    
    update: Joi.object({
      title: Joi.string().min(5).max(200).optional().trim(),
      content: Joi.string().min(10).max(5000).optional().trim(),
      image: Joi.string().optional()
    })
  },
  
  // Application validation
  application: {
    create: Joi.object({
      opportunity_id: Joi.number().integer().positive().required(),
      notes: Joi.string().max(500).optional().trim()
    })
  },
  
  // Report validation
  report: {
    create: Joi.object({
      reported_type: Joi.string().valid('user', 'community', 'post').required(),
      reported_id: Joi.number().integer().positive().required(),
      reason: Joi.string().min(5).max(200).required().trim(),
      description: Joi.string().max(1000).optional().trim()
    })
  },
  
  // Search validation
  search: {
    query: Joi.object({
      q: Joi.string().min(1).max(100).required().trim(),
      type: Joi.string().valid('users', 'posts', 'communities', 'all').optional(),
      limit: Joi.number().integer().min(1).max(50).optional().default(20),
      offset: Joi.number().integer().min(0).optional().default(0)
    })
  }
};

// Validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    
    if (!data) {
      return sendErrorResponse(res, 400, 'Validation data is required');
    }
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      logger.warn('Validation failed', {
        errors,
        source,
        path: req.path,
        method: req.method
      });
      
      return sendErrorResponse(res, 400, 'Validation failed', { errors });
    }
    
    // Replace the original data with validated and sanitized data
    req[source] = value;
    next();
  };
};

// Sanitization middleware
const sanitize = (req, res, next) => {
  // Remove any potential XSS attempts
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };
  
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };
  
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

// Rate limiting for sensitive operations
const sensitiveRateLimit = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    error: 'Too many sensitive operations, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  schemas,
  validate,
  sanitize,
  sensitiveRateLimit
};