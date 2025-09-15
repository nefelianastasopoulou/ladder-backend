// Environment configuration management
const path = require('path');

// Load environment variables
require('dotenv').config({ 
  path: path.join(__dirname, '..', '.env') 
});

// Environment validation
const requiredEnvVars = {
  JWT_SECRET: process.env.JWT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD
};

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('📝 Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Environment configuration
const config = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3001,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX) || 20,
  DB_POOL_MIN: parseInt(process.env.DB_POOL_MIN) || 2,
  DB_IDLE_TIMEOUT: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  DB_CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
  DB_MAX_USES: parseInt(process.env.DB_MAX_USES) || 7500,
  SLOW_QUERY_THRESHOLD: parseInt(process.env.SLOW_QUERY_THRESHOLD) || 1000,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_ISSUER: process.env.JWT_ISSUER || 'ladder-backend',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'ladder-app',
  
  // Email
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  
  // Admin
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : [],
  
  // SSL
  DATABASE_SSL_CA: process.env.DATABASE_SSL_CA,
  DATABASE_SSL_CERT: process.env.DATABASE_SSL_CERT,
  DATABASE_SSL_KEY: process.env.DATABASE_SSL_KEY,
  
  // Security
  TRUST_PROXY: process.env.TRUST_PROXY === 'true',
  
  // Environment-specific settings
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test'
};

// Validate JWT_SECRET strength
if (config.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET validation failed');
  console.error('🔒 JWT_SECRET must be at least 32 characters long for security!');
  console.error(`📏 Current length: ${config.JWT_SECRET.length}`);
  process.exit(1);
}

// Log configuration (without sensitive data)
console.log('🔧 Environment Configuration:');
console.log(`   Environment: ${config.NODE_ENV}`);
console.log(`   Port: ${config.PORT}`);
console.log(`   Log Level: ${config.LOG_LEVEL}`);
console.log(`   Database Pool: ${config.DB_POOL_MIN}-${config.DB_POOL_MAX}`);
console.log(`   Rate Limiting: ${config.RATE_LIMIT_MAX_REQUESTS} requests per ${config.RATE_LIMIT_WINDOW_MS / 1000 / 60} minutes`);

module.exports = config;
