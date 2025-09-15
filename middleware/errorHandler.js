/**
 * Comprehensive Error Handling Middleware
 * Provides consistent error handling across the application
 */

const logger = require('../utils/logger');

// Custom Error Classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.field = field;
    this.type = 'VALIDATION_ERROR';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.type = 'AUTHENTICATION_ERROR';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.type = 'AUTHORIZATION_ERROR';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.type = 'NOT_FOUND_ERROR';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.type = 'CONFLICT_ERROR';
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500);
    this.type = 'DATABASE_ERROR';
    this.originalError = originalError;
  }
}

// Error Response Formatter
const formatErrorResponse = (error, req) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response = {
    success: false,
    error: {
      message: error.message,
      type: error.type || 'UNKNOWN_ERROR',
      status: error.statusCode || 500,
      timestamp: error.timestamp || new Date().toISOString(),
      requestId: req.id || 'unknown'
    }
  };

  // Add additional details in development
  if (isDevelopment) {
    response.error.stack = error.stack;
    response.error.details = {
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };
  }

  // Add field information for validation errors
  if (error.field) {
    response.error.field = error.field;
  }

  return response;
};

// Database Error Handler
const handleDatabaseError = (err, operation = 'database operation') => {
  logger.error(`Database error during ${operation}:`, {
    error: err.message,
    code: err.code,
    detail: err.detail,
    operation
  });

  // Handle specific PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return new ConflictError('Resource already exists');
      case '23503': // Foreign key violation
        return new ValidationError('Referenced resource does not exist');
      case '23502': // Not null violation
        return new ValidationError('Required field is missing');
      case '42P01': // Undefined table
        return new DatabaseError('Database schema error');
      case 'ECONNREFUSED':
        return new DatabaseError('Database connection failed');
      default:
        return new DatabaseError(`Database error: ${err.message}`, err);
    }
  }

  return new DatabaseError(`Database operation failed: ${err.message}`, err);
};

// Global Error Handler Middleware
const globalErrorHandler = (err, req, res, next) => {
  let error = err;

  // Log the error
  logger.error('Global error handler:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Convert known error types
  if (err.name === 'ValidationError') {
    error = new ValidationError(err.message);
  } else if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  } else if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  } else if (err.name === 'CastError') {
    error = new ValidationError('Invalid data format');
  } else if (err.code && err.code.startsWith('23')) {
    // PostgreSQL constraint errors
    error = handleDatabaseError(err);
  } else if (!(err instanceof AppError)) {
    // Unknown error - don't expose internal details
    error = new AppError('Internal server error', 500);
  }

  // Send error response
  const errorResponse = formatErrorResponse(error, req);
  res.status(error.statusCode || 500).json(errorResponse);
};

// Async Error Wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Database Operation Wrapper
const dbOperation = (operation, query, params = []) => {
  return new Promise((resolve, reject) => {
    operation(query, params, (err, result) => {
      if (err) {
        reject(handleDatabaseError(err, 'database operation'));
      } else {
        resolve(result);
      }
    });
  });
};

// Validation Helper
const validateRequired = (fields, data) => {
  const missing = [];
  const errors = [];
  
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    errors.push(new ValidationError(`Missing required fields: ${missing.join(', ')}`));
  }
  
  return errors;
};

// Email Validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email');
  }
  return true;
};

// Password Validation
const validatePassword = (password) => {
  if (password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters long', 'password');
  }
  
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasLetter || !hasNumber) {
    throw new ValidationError('Password must contain at least one letter and one number', 'password');
  }
  
  return true;
};

module.exports = {
  // Error Classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  
  // Middleware
  globalErrorHandler,
  asyncHandler,
  
  // Utilities
  handleDatabaseError,
  dbOperation,
  formatErrorResponse,
  
  // Validation
  validateRequired,
  validateEmail,
  validatePassword
};
