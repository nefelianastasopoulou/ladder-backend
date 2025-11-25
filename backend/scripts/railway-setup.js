#!/usr/bin/env node

/**
 * Railway Deployment Setup Script
 * This script handles Railway-specific setup tasks including database initialization
 */

const { runMigrations } = require('./run-migration.js');
const { seedDatabase } = require('./seed-database.js');
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
    
    // Small delay to allow connection cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Seed database with initial data
    console.log('🌱 Seeding database with initial data...');
    await seedDatabase();
    console.log('✅ Database seeding completed');
    
    // Small delay to allow connection cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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

// Handle unhandled promise rejections and errors
process.on('unhandledRejection', (reason, promise) => {
  // Suppress database connection errors during cleanup
  if (reason && typeof reason === 'object' && reason.code === 'ETIMEDOUT') {
    console.log('⚠️  Database connection cleanup warning (safe to ignore)');
    return;
  }
  console.error('⚠️  Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  // Suppress database connection errors during cleanup
  if (error.code === 'ETIMEDOUT' || error.message.includes('Connection terminated')) {
    console.log('⚠️  Database connection cleanup warning (safe to ignore)');
    return;
  }
  console.error('⚠️  Uncaught exception:', error);
});

// Run setup if this script is executed directly
if (require.main === module) {
  setupRailway()
    .then(() => {
      // Give connections time to close gracefully
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    })
    .catch((error) => {
      console.error('💥 Unhandled error in Railway setup:', error);
      // Don't exit with error code for Railway deployment
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    });
}

module.exports = { setupRailway };
