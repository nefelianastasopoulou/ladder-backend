#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * This script validates all required environment variables and their formats
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const requiredEnvVars = {
  JWT_SECRET: process.env.JWT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD
};

const optionalEnvVars = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '3001',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  DB_POOL_MAX: process.env.DB_POOL_MAX || '20',
  DB_POOL_MIN: process.env.DB_POOL_MIN || '2',
  DB_IDLE_TIMEOUT: process.env.DB_IDLE_TIMEOUT || '30000',
  DB_CONNECTION_TIMEOUT: process.env.DB_CONNECTION_TIMEOUT || '2000',
  DB_MAX_USES: process.env.DB_MAX_USES || '7500',
  SLOW_QUERY_THRESHOLD: process.env.SLOW_QUERY_THRESHOLD || '1000',
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000',
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '200',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  DATABASE_SSL: process.env.DATABASE_SSL,
  DATABASE_SSL_REJECT_UNAUTHORIZED: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED,
  TRUST_PROXY: process.env.TRUST_PROXY
};

function validateEnvironmentVariables() {
  console.log('Validating environment variables...\n');
  
  let hasErrors = false;
  
  // Check for missing required variables
  const missingEnvVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    hasErrors = true;
  }

  // Validate specific environment variables
  const validationErrors = [];

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    validationErrors.push(`JWT_SECRET must be at least 32 characters long (current: ${process.env.JWT_SECRET.length})`);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (process.env.ADMIN_EMAIL && !emailRegex.test(process.env.ADMIN_EMAIL)) {
    validationErrors.push('ADMIN_EMAIL must be a valid email address');
  }

  // Validate port number
  const port = parseInt(process.env.PORT || '3001');
  if (isNaN(port) || port < 1 || port > 65535) {
    validationErrors.push('PORT must be a valid port number (1-65535)');
  }

  // Validate numeric environment variables
  const numericVars = ['DB_POOL_MAX', 'DB_POOL_MIN', 'DB_IDLE_TIMEOUT', 'DB_CONNECTION_TIMEOUT', 'DB_MAX_USES', 'SLOW_QUERY_THRESHOLD'];
  numericVars.forEach(varName => {
    const value = parseInt(process.env[varName] || '0');
    if (isNaN(value) || value < 0) {
      validationErrors.push(`${varName} must be a positive number`);
    }
  });

  // Validate LOG_LEVEL
  const validLogLevels = ['error', 'warn', 'info', 'debug'];
  if (!validLogLevels.includes(process.env.LOG_LEVEL || 'info')) {
    validationErrors.push(`LOG_LEVEL must be one of: ${validLogLevels.join(', ')}`);
  }

  // Validate NODE_ENV
  const validEnvironments = ['development', 'production', 'test'];
  if (!validEnvironments.includes(process.env.NODE_ENV || 'development')) {
    validationErrors.push(`NODE_ENV must be one of: ${validEnvironments.join(', ')}`);
  }

  if (validationErrors.length > 0) {
    console.error('❌ Environment variable validation errors:');
    validationErrors.forEach(error => {
      console.error(`   - ${error}`);
    });
    hasErrors = true;
  }

  // Display current configuration
  console.log('Current environment configuration:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   PORT: ${process.env.PORT || '3001'}`);
  console.log(`   LOG_LEVEL: ${process.env.LOG_LEVEL || 'info'}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
  console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not set'}`);
  console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set'}`);
  console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL ? '✅ Set' : '❌ Not set'}`);
  console.log(`   ADMIN_USERNAME: ${process.env.ADMIN_USERNAME ? '✅ Set' : '❌ Not set'}`);
  console.log(`   ADMIN_PASSWORD: ${process.env.ADMIN_PASSWORD ? '✅ Set' : '❌ Not set'}`);
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? `✅ Set (${process.env.JWT_SECRET.length} chars)` : '❌ Not set'}`);

  if (hasErrors) {
    console.log('\nEnvironment validation failed. Please fix the issues above.');
    process.exit(1);
  } else {
    console.log('\nAll environment variables are valid!');
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateEnvironmentVariables();
}

module.exports = { validateEnvironmentVariables };
