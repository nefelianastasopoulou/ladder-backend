/**
 * Standardized Response Utilities
 * Provides consistent API response formatting
 */

const logger = require('./logger');

// Success response helper
const sendSuccessResponse = (res, statusCode = 200, data = null, message = null) => {
  const response = {
    success: true,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  // Log successful responses in debug mode
  if (process.env.LOG_LEVEL === 'debug') {
    logger.debug('API Response', {
      status: statusCode,
      success: true,
      hasData: data !== null,
      message
    });
  }

  return res.status(statusCode).json(response);
};

// Error response helper
const sendErrorResponse = (res, statusCode = 500, message = 'Internal server error', details = null) => {
  const response = {
    success: false,
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString()
    }
  };

  if (details) {
    response.error.details = details;
  }

  // Log error responses
  logger.error('API Error Response', {
    status: statusCode,
    message,
    details
  });

  return res.status(statusCode).json(response);
};

// Pagination helper
const paginate = (data, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const total = data.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedData = data.slice(offset, offset + limit);

  return {
    data: paginatedData,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

// Database result formatter
const formatDatabaseResult = (result, single = false) => {
  if (!result || !result.rows) {
    return single ? null : [];
  }

  return single ? result.rows[0] : result.rows;
};

// User data formatter (removes sensitive information)
const formatUserData = (user, includeSensitive = false) => {
  if (!user) return null;

  const formatted = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    username: user.username,
    is_admin: user.is_admin,
    created_at: user.created_at
  };

  if (includeSensitive) {
    formatted.is_verified = user.is_verified;
    formatted.last_login = user.last_login;
  }

  return formatted;
};

// Post data formatter
const formatPostData = (post, includeAuthor = false) => {
  if (!post) return null;

  const formatted = {
    id: post.id,
    title: post.title,
    content: post.content,
    community_id: post.community_id,
    is_published: post.is_published,
    created_at: post.created_at,
    updated_at: post.updated_at
  };

  if (includeAuthor && post.author) {
    formatted.author = formatUserData(post.author);
  }

  return formatted;
};

// Community data formatter
const formatCommunityData = (community, includeMembers = false) => {
  if (!community) return null;

  const formatted = {
    id: community.id,
    name: community.name,
    description: community.description,
    category: community.category,
    member_count: community.member_count,
    is_public: community.is_public,
    created_at: community.created_at,
    updated_at: community.updated_at
  };

  if (includeMembers && community.members) {
    formatted.members = community.members.map(member => formatUserData(member));
  }

  return formatted;
};

// Opportunity data formatter
const formatOpportunityData = (opportunity, includeAuthor = false) => {
  if (!opportunity) return null;

  const formatted = {
    id: opportunity.id,
    title: opportunity.title,
    description: opportunity.description,
    category: opportunity.category,
    deadline: opportunity.deadline,
    requirements: opportunity.requirements,
    benefits: opportunity.benefits,
    is_active: opportunity.is_active,
    created_at: opportunity.created_at,
    updated_at: opportunity.updated_at
  };

  if (includeAuthor && opportunity.author) {
    formatted.author = formatUserData(opportunity.author);
  }

  return formatted;
};

// Message data formatter
const formatMessageData = (message, includeSender = false) => {
  if (!message) return null;

  const formatted = {
    id: message.id,
    content: message.content,
    conversation_id: message.conversation_id,
    is_read: message.is_read,
    created_at: message.created_at
  };

  if (includeSender && message.sender) {
    formatted.sender = formatUserData(message.sender);
  }

  return formatted;
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  if (typeof errors === 'string') {
    return { general: errors };
  }

  if (Array.isArray(errors)) {
    return { general: errors.join('; ') };
  }

  return errors;
};

// File upload response formatter
const formatFileUploadResponse = (file, url) => {
  return {
    id: file.id || null,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    url: url,
    uploadedAt: new Date().toISOString()
  };
};

// Health check response formatter
const formatHealthResponse = (status, details = {}) => {
  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    ...details
  };
};

module.exports = {
  // Response helpers
  sendSuccessResponse,
  sendErrorResponse,
  paginate,
  
  // Data formatters
  formatDatabaseResult,
  formatUserData,
  formatPostData,
  formatCommunityData,
  formatOpportunityData,
  formatMessageData,
  formatValidationErrors,
  formatFileUploadResponse,
  formatHealthResponse
};
