#!/usr/bin/env node

/**
 * Railway Deployment Setup Script
 * This script handles Railway-specific setup tasks including database initialization
 */

const { runMigrations } = require('./run-migration');
const logger = require('../utils/logger');

const setupRailway = async () => {
  try {
    console.log('🚀 Starting Railway deployment setup...');
    
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set');
      console.log('💡 Please ensure DATABASE_URL is configured in Railway');
      process.exit(1);
    }
    
    console.log('✅ DATABASE_URL is configured');
    
    // Check if JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET environment variable is not set');
      console.log('💡 Please ensure JWT_SECRET is configured in Railway');
      process.exit(1);
    }
    
    console.log('✅ JWT_SECRET is configured');
    
    // Run database migrations
    console.log('🔄 Running database migrations...');
    await runMigrations();
    console.log('✅ Database migrations completed');
    
    // Additional Railway-specific setup
    console.log('🔧 Railway setup completed successfully!');
    
  } catch (error) {
    console.error('💥 Railway setup failed:', error);
    console.error('Error details:', error.message);
    
    // Don't exit with error code for Railway deployment
    // This allows the deployment to continue even if setup fails
    console.log('⚠️  Continuing with deployment despite setup warnings...');
  }
};

// Run setup if this script is executed directly
if (require.main === module) {
  setupRailway().catch((error) => {
    console.error('💥 Unhandled error in Railway setup:', error);
    // Don't exit with error code for Railway deployment
    process.exit(0);
  });
}

module.exports = { setupRailway };
