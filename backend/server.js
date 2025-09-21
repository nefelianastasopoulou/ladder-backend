// Main server file - refactored for better organization
const express = require('express');
const path = require('path');

// Load environment variables
require('dotenv').config({ 
  path: path.join(__dirname, '.env') 
});

// Import configuration and utilities
const config = require('./config/environment');
const { validateEnvironment: validateConfigEnvironment } = config;
const logger = require('./utils/logger');
const { startMemoryMonitoring } = require('./utils/memoryMonitor');
const { setupDatabaseMonitoring } = require('./utils/databaseSetup');
const { corsOptions, generalRateLimit } = require('./middleware/setup');
const { setupRoutes } = require('./routes/setup');

// Import database
const db = require('./database');

// Import startup fix
const fixCountsOnStartup = require('./scripts/fix-counts-on-startup');

// Environment validation
const validateEnvironment = () => {
  try {
    const EnvironmentValidator = require('./config/env-validator');
    const envValidator = new EnvironmentValidator();
    const envValidation = envValidator.getValidationReport();

    if (!envValidation.isValid && config.isProduction) {
      logger.error('Environment validation failed:');
      envValidation.errors.forEach(error => logger.error(`  - ${error}`));
      process.exit(1);
    } else if (!envValidation.isValid) {
      logger.warn('Environment validation warnings (non-production):');
      envValidation.errors.forEach(error => logger.warn(`  - ${error}`));
    }
  } catch (error) {
    logger.warn('Environment validation module not found or error:', error.message);
    // Continue without validation
  }
};

// Initialize Express app
const app = express();

// Trust proxy for production
if (config.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

// Middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(require('cors')(corsOptions));
app.use(generalRateLimit);

// Add sanitization middleware
const { sanitize } = require('./middleware/validation');
app.use(sanitize);

// Setup database monitoring
setupDatabaseMonitoring(db);

// Setup routes
setupRoutes(app);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(err.status || 500).json({
    error: config.isDevelopment ? err.message : 'Internal server error',
    ...(config.isDevelopment && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    db.end(() => {
      logger.info('Database connections closed');
      process.exit(0);
    });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Start server
const startServer = () => {
  // Validate environment
  validateConfigEnvironment();
  validateEnvironment();
  
  // Start memory monitoring
  startMemoryMonitoring(config.NODE_ENV);
  
  // Start server
  const server = app.listen(config.PORT, '0.0.0.0', async () => {
    logger.info(`🚀 Server running on port ${config.PORT}`);
    logger.info(`📊 Environment: ${config.NODE_ENV}`);
    logger.info(`🔒 Trust Proxy: ${config.TRUST_PROXY}`);
    logger.info(`📈 Rate Limit: ${config.RATE_LIMIT_MAX_REQUESTS} requests per ${config.RATE_LIMIT_WINDOW_MS / 1000 / 60} minutes`);
    
    // Fix counts on startup
    await fixCountsOnStartup();
  });
  
  // Graceful shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  return server;
};

// Start the server
const server = startServer();

module.exports = { app, server };
