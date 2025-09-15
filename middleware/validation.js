const { ValidationError } = require('./errorHandler');

// Validation rules
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
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
  },
  
  username: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: 'Username must be 3-20 characters, letters, numbers, and underscores only'
  },
  
  fullName: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    message: 'Full name must be between 2 and 100 characters'
  },
  
  content: {
    required: true,
    type: 'string',
    minLength: 10,
    maxLength: 5000,
    message: 'Content must be between 10 and 5000 characters'
  },
  
  title: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 200,
    message: 'Title must be between 3 and 200 characters'
  }
};

// Generic validation function
const validate = (data, schema) => {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Check required fields
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors.push(`${field} is required`);
      continue;
    }
    
    // Skip validation if field is not required and not provided
    if (!rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      continue;
    }
    
    // Type validation
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${field} must be a ${rules.type}`);
      continue;
    }
    
    // Length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${field} must be at least ${rules.minLength} characters long`);
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${field} must be no more than ${rules.maxLength} characters long`);
    }
    
    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(rules.message || `${field} format is invalid`);
    }
  }
  
  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }
  
  return true;
};

// Specific validation schemas
const schemas = {
  signup: {
    email: validationRules.email,
    password: validationRules.password,
    username: validationRules.username,
    fullName: validationRules.fullName
  },
  
  login: {
    email: { ...validationRules.email, required: false },
    username: { ...validationRules.username, required: false },
    password: validationRules.password
  },
  
  changePassword: {
    currentPassword: { required: true, type: 'string' },
    newPassword: validationRules.password
  },
  
  post: {
    title: validationRules.title,
    content: validationRules.content
  },
  
  community: {
    name: {
      required: true,
      type: 'string',
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9\s_-]+$/,
      message: 'Community name must be 3-50 characters, letters, numbers, spaces, hyphens, and underscores only'
    },
    description: {
      required: false,
      type: 'string',
      maxLength: 500,
      message: 'Description must be no more than 500 characters'
    }
  },
  
  profile: {
    fullName: validationRules.fullName,
    username: validationRules.username,
    bio: {
      required: false,
      type: 'string',
      maxLength: 500,
      message: 'Bio must be no more than 500 characters'
    },
    location: {
      required: false,
      type: 'string',
      maxLength: 100,
      message: 'Location must be no more than 100 characters'
    }
  }
};

// Middleware factory for validation
const validateRequest = (schemaName) => {
  return (req, res, next) => {
    try {
      const schema = schemas[schemaName];
      if (!schema) {
        throw new Error(`Validation schema '${schemaName}' not found`);
      }
      
      // Validate request body
      validate(req.body, schema);
      
      // Check for unexpected fields
      const allowedFields = Object.keys(schema).filter(key => !key.startsWith('_'));
      const unexpectedFields = Object.keys(req.body).filter(field => !allowedFields.includes(field));
      
      if (unexpectedFields.length > 0) {
        throw new ValidationError(`Unexpected fields: ${unexpectedFields.join(', ')}`);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Content length validation middleware
const validateContentLength = (maxLength = 10000) => {
  return (req, res, next) => {
    const contentLength = req.get('content-length');
    if (contentLength && parseInt(contentLength) > maxLength) {
      return res.status(413).json({
        success: false,
        error: {
          message: `Request too large. Maximum size is ${maxLength} bytes.`,
          status: 413,
          timestamp: new Date().toISOString()
        }
      });
    }
    next();
  };
};

// Sanitization middleware
const sanitize = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
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

module.exports = {
  validate,
  validateRequest,
  validateContentLength,
  sanitize,
  schemas,
  validationRules
};