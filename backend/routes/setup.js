// Routes setup and organization
const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
// const { authRateLimit } = require('../middleware/setup'); // Disabled for testing
const authRoutes = require('./auth');
const communityRoutes = require('./communities');
const healthRoutes = require('./health');
const profileRoutes = require('./profile');
const opportunitiesRoutes = require('./opportunities');
const onboardingRoutes = require('./onboarding');
const favoritesRoutes = require('./favorites');
const applicationsRoutes = require('./applications');
const settingsRoutes = require('./settings');
const searchRoutes = require('./search');
const conversationsRoutes = require('./conversations');
const adminRoutes = require('./admin');
const reportsRoutes = require('./reports');
const postsRoutes = require('./posts');
const followersRoutes = require('./followers');

const setupRoutes = (app) => {
  // API routes
  const apiRouter = express.Router();

  // Health check routes (no auth required)
  apiRouter.use('/health', healthRoutes);

  // Auth routes (no rate limiting for testing)
  apiRouter.use('/auth', authRoutes);

  // Public routes (no auth required)
  apiRouter.use('/opportunities', opportunitiesRoutes);
  apiRouter.use('/posts', postsRoutes);

  // Protected routes (auth required)
  apiRouter.use('/profile', authenticateToken, profileRoutes);
  apiRouter.use('/onboarding', authenticateToken, onboardingRoutes);
  apiRouter.use('/favorites', authenticateToken, favoritesRoutes);
  apiRouter.use('/applications', authenticateToken, applicationsRoutes);
  apiRouter.use('/settings', authenticateToken, settingsRoutes);
  apiRouter.use('/search', authenticateToken, searchRoutes);
  apiRouter.use('/conversations', authenticateToken, conversationsRoutes);
  apiRouter.use('/reports', authenticateToken, reportsRoutes);
  apiRouter.use('/communities', authenticateToken, communityRoutes);
  apiRouter.use('/followers', authenticateToken, followersRoutes);

  // Admin routes (admin only)
  apiRouter.use('/admin', authenticateToken, requireAdmin, adminRoutes);

  // Mount API routes
  app.use('/api', apiRouter);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'Ladder API Server',
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      endpoints: {
        health: '/api/health',
        health_detailed: '/api/health/detailed',
        health_ready: '/api/health/ready',
        health_live: '/api/health/live',
        auth: '/api/auth',
        profile: '/api/profile',
        opportunities: '/api/opportunities',
        onboarding: '/api/onboarding',
        favorites: '/api/favorites',
        applications: '/api/applications',
        settings: '/api/settings',
        search: '/api/search',
               conversations: '/api/conversations',
               communities: '/api/communities',
               reports: '/api/reports',
               posts: '/api/posts',
               followers: '/api/followers',
               admin: '/api/admin'
      }
    });
  });

  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      error: 'API endpoint not found',
      path: req.originalUrl,
      method: req.method
    });
  });
};

module.exports = { setupRoutes };
