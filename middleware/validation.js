/**
 * Input Validation Middleware
 * Provides comprehensive validation for API endpoints
 */

const { ValidationError } = require('./errorHandler');

// Common validation rules
const validationRules = {
  email: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email format'
  },
  
  password: {
    required: true,
    type: 'string',
    minLength: 6,
    pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
    message: 'Password must be at least 6 characters with at least one letter and one number'
  },
  
  username: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: 'Username must be 3-30 characters, letters, numbers, and underscores only'
  },
  
  fullName: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    message: 'Full name must be 2-100 characters'
  },
  
  communityName: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-_]+$/,
    message: 'Community name must be 3-50 characters, letters, numbers, spaces, hyphens, and underscores only'
  },
  
  postTitle: {
    required: true,
    type: 'string',
    minLength: 5,
    maxLength: 200,
    message: 'Post title must be 5-200 characters'
  },
  
  postContent: {
    required: true,
    type: 'string',
    minLength: 10,
    maxLength: 10000,
    message: 'Post content must be 10-10000 characters'
  },
  
  opportunityTitle: {
    required: true,
    type: 'string',
    minLength: 5,
    maxLength: 200,
    message: 'Opportunity title must be 5-200 characters'
  },
  
  opportunityDescription: {
    required: true,
    type: 'string',
    minLength: 20,
    maxLength: 5000,
    message: 'Opportunity description must be 20-5000 characters'
  }
};

// Validation helper function
const validateField = (value, rule, fieldName) => {
  const errors = [];

  // Check required
  if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    errors.push(`${fieldName} is required`);
    return errors;
  }

  // Skip further validation if value is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return errors;
  }

  // Check type
  if (rule.type && typeof value !== rule.type) {
    errors.push(`${fieldName} must be a ${rule.type}`);
    return errors;
  }

  // Check string length
  if (rule.type === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`${fieldName} must be at least ${rule.minLength} characters`);
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push(`${fieldName} must be no more than ${rule.maxLength} characters`);
    }
  }

  // Check pattern
  if (rule.pattern && !rule.pattern.test(value)) {
    errors.push(rule.message || `${fieldName} format is invalid`);
  }

  return errors;
};

// Main validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const data = req.body;

    // Validate each field in the schema
    for (const [fieldName, rule] of Object.entries(schema)) {
      const fieldErrors = validateField(data[fieldName], rule, fieldName);
      errors.push(...fieldErrors);
    }

    // Check for unexpected fields (optional)
    if (schema._strict) {
      const allowedFields = Object.keys(schema).filter(key => !key.startsWith('_'));
      const unexpectedFields = Object.keys(data).filter(field => !allowedFields.includes(field));
      if (unexpectedFields.length > 0) {
        errors.push(`Unexpected fields: ${unexpectedFields.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError(errors.join('; ')));
    }

    next();
  };
};

// Predefined validation schemas
const schemas = {
  // Authentication
  login: {
    email: validationRules.email,
    password: { required: true, type: 'string' }
  },
  
  register: {
    email: validationRules.email,
    password: validationRules.password,
    full_name: validationRules.fullName,
    username: validationRules.username
  },
  
  changePassword: {
    currentPassword: { required: true, type: 'string' },
    newPassword: validationRules.password
  },
  
  // Profile
  updateProfile: {
    full_name: { ...validationRules.fullName, required: false },
    username: { ...validationRules.username, required: false },
    bio: { type: 'string', maxLength: 500 },
    location: { type: 'string', maxLength: 100 },
    website: { type: 'string', maxLength: 200 }
  },
  
  // Communities
  createCommunity: {
    name: validationRules.communityName,
    description: { required: true, type: 'string', minLength: 10, maxLength: 1000 },
    category: { type: 'string', maxLength: 50 }
  },
  
  updateCommunity: {
    name: { ...validationRules.communityName, required: false },
    description: { type: 'string', minLength: 10, maxLength: 1000 },
    category: { type: 'string', maxLength: 50 }
  },
  
  // Posts
  createPost: {
    title: validationRules.postTitle,
    content: validationRules.postContent,
    community_id: { required: true, type: 'number' }
  },
  
  updatePost: {
    title: { ...validationRules.postTitle, required: false },
    content: { ...validationRules.postContent, required: false }
  },
  
  // Opportunities
  createOpportunity: {
    title: validationRules.opportunityTitle,
    description: validationRules.opportunityDescription,
    category: { required: true, type: 'string', maxLength: 50 },
    deadline: { type: 'string' }, // ISO date string
    requirements: { type: 'string', maxLength: 2000 },
    benefits: { type: 'string', maxLength: 2000 }
  },
  
  updateOpportunity: {
    title: { ...validationRules.opportunityTitle, required: false },
    description: { ...validationRules.opportunityDescription, required: false },
    category: { type: 'string', maxLength: 50 },
    deadline: { type: 'string' },
    requirements: { type: 'string', maxLength: 2000 },
    benefits: { type: 'string', maxLength: 2000 }
  },
  
  // Messages
  sendMessage: {
    content: { required: true, type: 'string', minLength: 1, maxLength: 2000 },
    conversation_id: { required: true, type: 'number' }
  },
  
  // Reports
  createReport: {
    reported_type: { required: true, type: 'string', enum: ['post', 'user', 'community', 'opportunity'] },
    reported_id: { required: true, type: 'number' },
    reason: { required: true, type: 'string', minLength: 10, maxLength: 500 },
    description: { type: 'string', maxLength: 1000 }
  }
};

// Sanitization middleware
const sanitize = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
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

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  
  next();
};

// Content length validation
const validateContentLength = (maxLength = 10 * 1024 * 1024) => { // 10MB default
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    
    if (contentLength > maxLength) {
      return next(new ValidationError(`Request entity too large. Maximum size: ${maxLength} bytes`));
    }
    
    next();
  };
};

module.exports = {
  validate,
  sanitize,
  validateContentLength,
  schemas,
  validationRules
};
