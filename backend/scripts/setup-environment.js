#!/usr/bin/env node

/**
 * Environment Setup Script for Backend
 * Sets up environment variables for different deployment environments
 */

// const fs = require('fs'); // Unused import
// const path = require('path'); // Unused import

// Environment configurations
const environments = {
  development: {
    NODE_ENV: 'development',
    PORT: 3001,
    LOG_LEVEL: 'debug',
    DB_POOL_MIN: 2,
    DB_POOL_MAX: 5,
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX_REQUESTS: 1000,
    TRUST_PROXY: false,
    ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:8081,exp://192.168.1.100:8081'
  },
  staging: {
    NODE_ENV: 'staging',
    PORT: 3001,
    LOG_LEVEL: 'info',
    DB_POOL_MIN: 2,
    DB_POOL_MAX: 10,
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX_REQUESTS: 500,
    TRUST_PROXY: true,
    ALLOWED_ORIGINS: 'https://your-staging-frontend.up.railway.app'
  },
  production: {
    NODE_ENV: 'production',
    PORT: 3001,
    LOG_LEVEL: 'warn',
    DB_POOL_MIN: 5,
    DB_POOL_MAX: 20,
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX_REQUESTS: 100,
    TRUST_PROXY: true,
    ALLOWED_ORIGINS: 'https://your-production-frontend.up.railway.app'
  },
  test: {
    NODE_ENV: 'test',
    PORT: 3002,
    LOG_LEVEL: 'error',
    DB_POOL_MIN: 1,
    DB_POOL_MAX: 2,
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX_REQUESTS: 1000,
    TRUST_PROXY: false,
    ALLOWED_ORIGINS: 'http://localhost:3000'
  }
};

function setupEnvironment(env = 'development') {
  const config = environments[env];
  
  if (!config) {
    console.error(`❌ Unknown environment: ${env}`);
    console.error('Available environments: development, staging, production, test');
    process.exit(1);
  }

  // Set environment variables
  Object.entries(config).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });

  console.log(`✅ Environment setup complete for: ${env}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   PORT: ${process.env.PORT}`);
  console.log(`   LOG_LEVEL: ${process.env.LOG_LEVEL}`);
  console.log(`   DB_POOL: ${process.env.DB_POOL_MIN}-${process.env.DB_POOL_MAX}`);
  console.log(`   RATE_LIMIT: ${process.env.RATE_LIMIT_MAX_REQUESTS} requests per ${process.env.RATE_LIMIT_WINDOW_MS / 1000 / 60} minutes`);
}

// Get environment from command line argument
const environment = process.argv[2] || 'development';

// Run setup
setupEnvironment(environment);

module.exports = { setupEnvironment, environments };
