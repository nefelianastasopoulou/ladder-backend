const logger = require('../utils/logger');

// Custom Error Classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400);
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500);
    this.originalError = originalError;
  }
}

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Database error handler
const handleDatabaseError = (err, res, operation = 'database operation') => {
  logger.error(`Database error during ${operation}:`, { 
    error: err.message, 
    operation, 
    stack: err.stack 
  });
  
  if (err.code === '23505') { // Unique constraint violation
    return sendErrorResponse(res, 409, 'Resource already exists');
  } else if (err.code === '23503') { // Foreign key constraint violation
    return sendErrorResponse(res, 400, 'Referenced resource does not exist');
  } else if (err.code === '23502') { // Not null constraint violation
    return sendErrorResponse(res, 400, 'Required field is missing');
  } else {
    return sendErrorResponse(res, 500, 'Database operation failed');
  }
};

// Standardized error response
const sendErrorResponse = (res, statusCode, message, details = null) => {
  const errorResponse = {
    success: false,
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString()
    }
  };

  if (details) {
    errorResponse.error.details = details;
  }

  // Add request ID if available
  if (res.locals.requestId) {
    errorResponse.error.requestId = res.locals.requestId;
  }

  return res.status(statusCode).json(errorResponse);
};

// Standardized success response
const sendSuccessResponse = (res, statusCode, data = null, message = null) => {
  const successResponse = {
    success: true,
    status: statusCode,
    timestamp: new Date().toISOString()
  };

  if (message) {
    successResponse.message = message;
  }

  if (data) {
    successResponse.data = data;
  }

  // Add request ID if available
  if (res.locals.requestId) {
    successResponse.requestId = res.locals.requestId;
  }

  return res.status(statusCode).json(successResponse);
};

// Global error handler
const globalErrorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Global error handler:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new NotFoundError(message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ConflictError(message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ValidationError(message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AuthenticationError(message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AuthenticationError(message);
  }

  // Database errors
  if (err.code && err.code.startsWith('23')) {
    return handleDatabaseError(err, res, 'database operation');
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  const isDevelopment = process.env.NODE_ENV === 'development';

  const errorResponse = {
    success: false,
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString()
    }
  };

  // Include stack trace in development
  if (isDevelopment) {
    errorResponse.error.stack = err.stack;
  }

  // Add request ID if available
  if (res.locals.requestId) {
    errorResponse.error.requestId = res.locals.requestId;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  asyncHandler,
  handleDatabaseError,
  sendErrorResponse,
  sendSuccessResponse,
  globalErrorHandler
};