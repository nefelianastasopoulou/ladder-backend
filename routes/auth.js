/**
 * Authentication Routes
 * Handles user authentication and authorization
 */

const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');
const { generateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Initialize services
let userService;
const initializeServices = (db) => {
  if (!userService) {
    userService = new UserService(db);
  }
};

// Register user
router.post('/register', validate(schemas.register), asyncHandler(async (req, res) => {
  initializeServices(req.db);
  
  const userData = req.body;
  const user = await userService.createUser(userData);
  
  // Generate JWT token
  const token = generateToken(user);
  
  logger.info('User registered successfully', { userId: user.id, email: user.email });
  
  sendSuccessResponse(res, 201, {
    user,
    token,
    message: 'User registered successfully'
  });
}));

// Login user
router.post('/login', validate(schemas.login), asyncHandler(async (req, res) => {
  initializeServices(req.db);
  
  const { email, password } = req.body;
  const user = await userService.authenticateUser(email, password);
  
  // Generate JWT token
  const token = generateToken(user);
  
  logger.auth('login', user.id, true);
  
  sendSuccessResponse(res, 200, {
    user,
    token,
    message: 'Login successful'
  });
}));

// Change password
router.post('/change-password', validate(schemas.changePassword), asyncHandler(async (req, res) => {
  initializeServices(req.db);
  
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  
  await userService.changePassword(userId, currentPassword, newPassword);
  
  logger.info('Password changed successfully', { userId });
  
  sendSuccessResponse(res, 200, {
    message: 'Password changed successfully'
  });
}));

// Get current user profile
router.get('/me', asyncHandler(async (req, res) => {
  initializeServices(req.db);
  
  const user = await userService.getUserById(req.user.id);
  
  sendSuccessResponse(res, 200, {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      username: user.username,
      is_admin: user.is_admin,
      created_at: user.created_at,
      last_login: user.last_login
    }
  });
}));

// Update user profile
router.put('/profile', validate(schemas.updateProfile), asyncHandler(async (req, res) => {
  initializeServices(req.db);
  
  const userId = req.user.id;
  const updateData = req.body;
  
  const updatedUser = await userService.updateUser(userId, updateData);
  
  logger.info('User profile updated', { userId });
  
  sendSuccessResponse(res, 200, {
    user: updatedUser,
    message: 'Profile updated successfully'
  });
}));

// Search users
router.get('/search', asyncHandler(async (req, res) => {
  initializeServices(req.db);
  
  const { q: query, page = 1, limit = 10 } = req.query;
  
  if (!query || query.trim().length < 2) {
    return sendErrorResponse(res, 400, 'Search query must be at least 2 characters');
  }
  
  const users = await userService.searchUsers(query, parseInt(page), parseInt(limit));
  
  sendSuccessResponse(res, 200, {
    users,
    query,
    page: parseInt(page),
    limit: parseInt(limit)
  });
}));

// Get user by ID (public profile)
router.get('/:id', asyncHandler(async (req, res) => {
  initializeServices(req.db);
  
  const userId = parseInt(req.params.id);
  const user = await userService.getUserById(userId);
  
  // Return public profile only
  const publicProfile = {
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    created_at: user.created_at
  };
  
  sendSuccessResponse(res, 200, { user: publicProfile });
}));

module.exports = router;
