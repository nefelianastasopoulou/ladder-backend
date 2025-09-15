/**
 * Community Routes
 * Handles community-related endpoints
 */

const express = require('express');
const router = express.Router();
const CommunityService = require('../services/communityService');
const { validate, schemas } = require('../middleware/validation');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Initialize services
let communityService;
const initializeServices = (db) => {
  if (!communityService) {
    communityService = new CommunityService(db);
  }
};

// Get all communities
router.get('/', asyncHandler(async (req, res) => {
  initializeServices(req.db);
  
  const { page = 1, limit = 10, category } = req.query;
  const communities = await communityService.getAllCommunities(
    parseInt(page), 
    parseInt(limit), 
    category
  );
  
  sendSuccessResponse(res, 200, {
    communities,
    page: parseInt(page),
    limit: parseInt(limit),
    category: category || null
  });
}));

// Search communities
router.get('/search', asyncHandler(async (req, res) => {
  initializeServices(req.db);
  
  const { q: query, page = 1, limit = 10 } = req.query;
  
  if (!query || query.trim().length < 2) {
    return sendErrorResponse(res, 400, 'Search query must be at least 2 characters');
  }
  
  const communities = await communityService.searchCommunities(
    query, 
    parseInt(page), 
    parseInt(limit)
  );
  
  sendSuccessResponse(res, 200, {
    communities,
    query,
    page: parseInt(page),
    limit: parseInt(limit)
  });
}));

// Get community by ID
router.get('/:id', asyncHandler(async (req, res) => {
  initializeServices(req.db);
  
  const communityId = parseInt(req.params.id);
  const community = await communityService.getCommunityById(communityId);
  
  sendSuccessResponse(res, 200, { community });
}));

// Create community
router.post('/', validate(schemas.createCommunity), asyncHandler(async (req, res) => {
  initializeServices(req.db);
  
  const communityData = req.body;
  const creatorId = req.user.id;
  
  const community = await communityService.createCommunity(communityData, creatorId);
  
  logger.info('Community created', { 
    communityId: community.id, 
    name: community.name, 
    creatorId 
  });
  
  sendSuccessResponse(res, 201, {
    community,
    message: 'Community created successfully'
  });
}));

// Update community
router.put('/:id', validate(schemas.updateCommunity), asyncHandler(async (req, res) => {
  initializeServices(req.db);
  
  const communityId = parseInt(req.params.id);
  const updateData = req.body;
  const userId = req.user.id;
  
  const community = await communityService.updateCommunity(communityId, updateData, userId);
  
  logger.info('Community updated', { communityId, userId });
  
  sendSuccessResponse(res, 200, {
    community,
    message: 'Community updated successfully'
  });
}));

// Delete community
router.delete('/:id', asyncHandler(async (req, res) => {
  initializeServices(req.db);
  
  const communityId = parseInt(req.params.id);
  const userId = req.user.id;
  
  await communityService.deleteCommunity(communityId, userId);
  
  logger.info('Community deleted', { communityId, userId });
  
  sendSuccessResponse(res, 200, {
    message: 'Community deleted successfully'
  });
}));

// Join community
router.post('/:id/join', asyncHandler(async (req, res) => {
  initializeServices(req.db);
  
  const communityId = parseInt(req.params.id);
  const userId = req.user.id;
  
  await communityService.addMember(communityId, userId);
  
  logger.info('User joined community', { communityId, userId });
  
  sendSuccessResponse(res, 200, {
    message: 'Successfully joined community'
  });
}));

// Leave community
router.post('/:id/leave', asyncHandler(async (req, res) => {
  initializeServices(req.db);
  
  const communityId = parseInt(req.params.id);
  const userId = req.user.id;
  
  await communityService.removeMember(communityId, userId);
  
  logger.info('User left community', { communityId, userId });
  
  sendSuccessResponse(res, 200, {
    message: 'Successfully left community'
  });
}));

// Get community members
router.get('/:id/members', asyncHandler(async (req, res) => {
  initializeServices(req.db);
  
  const communityId = parseInt(req.params.id);
  const { page = 1, limit = 20 } = req.query;
  
  const members = await communityService.getCommunityMembers(
    communityId, 
    parseInt(page), 
    parseInt(limit)
  );
  
  sendSuccessResponse(res, 200, {
    members,
    communityId,
    page: parseInt(page),
    limit: parseInt(limit)
  });
}));

// Get user's communities
router.get('/user/:userId', asyncHandler(async (req, res) => {
  initializeServices(req.db);
  
  const userId = parseInt(req.params.userId);
  const communities = await communityService.getUserCommunities(userId);
  
  sendSuccessResponse(res, 200, {
    communities,
    userId
  });
}));

module.exports = router;
