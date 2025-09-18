/**
 * Response Utility Functions
 * Provides standardized response formatting for the API
 */

const logger = require('./logger');

/**
 * Send standardized error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} details - Optional additional error details
 */
const sendErrorResponse = (res, statusCode, message, details = {}) => {
  // Log the error
  logger.error('API Error Response', {
    statusCode,
    message,
    details,
    path: res.req?.path,
    method: res.req?.method,
    ip: res.req?.ip
  });

  // Prepare error response
  const errorResponse = {
    error: true,
    message,
    status: statusCode,
    timestamp: new Date().toISOString()
  };

  // Add details if provided
  if (Object.keys(details).length > 0) {
    errorResponse.details = details;
  }

  // Add request ID if available
  if (res.req?.id) {
    errorResponse.requestId = res.req.id;
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Send standardized success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message
 * @param {Object} data - Response data
 * @param {Object} meta - Optional metadata
 */
const sendSuccessResponse = (res, statusCode = 200, message, data = null, meta = {}) => {
  // Log successful response
  logger.info('API Success Response', {
    statusCode,
    message,
    dataType: data ? typeof data : 'null',
    path: res.req?.path,
    method: res.req?.method
  });

  // Prepare success response
  const successResponse = {
    success: true,
    message,
    status: statusCode,
    timestamp: new Date().toISOString()
  };

  // Add data if provided
  if (data !== null) {
    successResponse.data = data;
  }

  // Add metadata if provided
  if (Object.keys(meta).length > 0) {
    successResponse.meta = meta;
  }

  // Add request ID if available
  if (res.req?.id) {
    successResponse.requestId = res.req.id;
  }

  // Send response
  res.status(statusCode).json(successResponse);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of data items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} message - Success message
 */
const sendPaginatedResponse = (res, data, page, limit, total, message = 'Data retrieved successfully') => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const pagination = {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };

  sendSuccessResponse(res, 200, message, data, { pagination });
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors
 * @param {string} message - Error message
 */
const sendValidationError = (res, errors, message = 'Validation failed') => {
  sendErrorResponse(res, 400, message, { errors });
};

/**
 * Send authentication error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendAuthError = (res, message = 'Authentication required') => {
  sendErrorResponse(res, 401, message);
};

/**
 * Send authorization error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendForbiddenError = (res, message = 'Access forbidden') => {
  sendErrorResponse(res, 403, message);
};

/**
 * Send not found error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendNotFoundError = (res, message = 'Resource not found') => {
  sendErrorResponse(res, 404, message);
};

/**
 * Send conflict error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendConflictError = (res, message = 'Resource conflict') => {
  sendErrorResponse(res, 409, message);
};

/**
 * Send rate limit error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} retryAfter - Seconds to wait before retrying
 */
const sendRateLimitError = (res, message = 'Too many requests', retryAfter = 60) => {
  sendErrorResponse(res, 429, message, { retryAfter });
};

/**
 * Send internal server error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Object} details - Optional error details
 */
const sendInternalError = (res, message = 'Internal server error', details = {}) => {
  sendErrorResponse(res, 500, message, details);
};

/**
 * Send service unavailable error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const sendServiceUnavailableError = (res, message = 'Service temporarily unavailable') => {
  sendErrorResponse(res, 503, message);
};

/**
 * Send created response
 * @param {Object} res - Express response object
 * @param {Object} data - Created resource data
 * @param {string} message - Success message
 */
const sendCreatedResponse = (res, data, message = 'Resource created successfully') => {
  sendSuccessResponse(res, 201, message, data);
};

/**
 * Send updated response
 * @param {Object} res - Express response object
 * @param {Object} data - Updated resource data
 * @param {string} message - Success message
 */
const sendUpdatedResponse = (res, data, message = 'Resource updated successfully') => {
  sendSuccessResponse(res, 200, message, data);
};

/**
 * Send deleted response
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 */
const sendDeletedResponse = (res, message = 'Resource deleted successfully') => {
  sendSuccessResponse(res, 200, message);
};

/**
 * Send no content response
 * @param {Object} res - Express response object
 */
const sendNoContentResponse = (res) => {
  res.status(204).send();
};

module.exports = {
  sendErrorResponse,
  sendSuccessResponse,
  sendPaginatedResponse,
  sendValidationError,
  sendAuthError,
  sendForbiddenError,
  sendNotFoundError,
  sendConflictError,
  sendRateLimitError,
  sendInternalError,
  sendServiceUnavailableError,
  sendCreatedResponse,
  sendUpdatedResponse,
  sendDeletedResponse,
  sendNoContentResponse
};