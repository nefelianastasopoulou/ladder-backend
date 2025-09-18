// Environment configuration management
const path = require('path');
const { environments, requiredEnvVars } = require('../../config/environments');

// Load environment variables
// Try .env.local first (for development), then fall back to .env
const fs = require('fs');
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// Environment validation function
const validateEnvironment = () => {
  const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars);
    console.error('📝 Please check your .env file and ensure all required variables are set.');
    
    // Only exit in production - allow development to continue with warnings
    const currentEnv = process.env.NODE_ENV || 'development';
    if (currentEnv === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️  Continuing in development mode with missing environment variables...');
    }
  }
};

// Get current environment configuration
const currentEnv = process.env.NODE_ENV || 'development';
const envDefaults = environments[currentEnv] || environments.development;

// Environment configuration with centralized defaults
const config = {
  // Application
  NODE_ENV: process.env.NODE_ENV || envDefaults.NODE_ENV,
  PORT: parseInt(process.env.PORT) || envDefaults.PORT,
  LOG_LEVEL: process.env.LOG_LEVEL || envDefaults.LOG_LEVEL,
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX) || envDefaults.DB_POOL_MAX,
  DB_POOL_MIN: parseInt(process.env.DB_POOL_MIN) || envDefaults.DB_POOL_MIN,
  DB_IDLE_TIMEOUT: parseInt(process.env.DB_IDLE_TIMEOUT) || envDefaults.DB_IDLE_TIMEOUT,
  DB_CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT) || envDefaults.DB_CONNECTION_TIMEOUT,
  DB_MAX_USES: parseInt(process.env.DB_MAX_USES) || envDefaults.DB_MAX_USES,
  SLOW_QUERY_THRESHOLD: parseInt(process.env.SLOW_QUERY_THRESHOLD) || envDefaults.SLOW_QUERY_THRESHOLD,
  
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
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || envDefaults.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || envDefaults.RATE_LIMIT_MAX_REQUESTS,
  
  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : 
    (envDefaults.ALLOWED_ORIGINS ? envDefaults.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : []),
  
  // SSL
  DATABASE_SSL_CA: process.env.DATABASE_SSL_CA,
  DATABASE_SSL_CERT: process.env.DATABASE_SSL_CERT,
  DATABASE_SSL_KEY: process.env.DATABASE_SSL_KEY,
  DATABASE_SSL_REJECT_UNAUTHORIZED: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
  
  // Security
  TRUST_PROXY: process.env.TRUST_PROXY === 'true' || envDefaults.TRUST_PROXY,
  
  // File Storage
  STORAGE_TYPE: process.env.STORAGE_TYPE || 'local',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  
  // Environment-specific settings
  isDevelopment: currentEnv === 'development',
  isProduction: currentEnv === 'production',
  isStaging: currentEnv === 'staging',
  isTest: currentEnv === 'test'
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
console.log(`   Storage Type: ${config.STORAGE_TYPE}`);
console.log(`   Trust Proxy: ${config.TRUST_PROXY}`);

module.exports = { ...config, validateEnvironment };
