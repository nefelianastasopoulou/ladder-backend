// Environment configuration management
// This file defines all environment-specific configurations in one place

const environments = {
  development: {
    // Application
    NODE_ENV: 'development',
    PORT: 3001,
    LOG_LEVEL: 'debug',
    
    // Database
    DB_POOL_MAX: 10,
    DB_POOL_MIN: 1,
    DB_IDLE_TIMEOUT: 10000,
    DB_CONNECTION_TIMEOUT: 2000,
    DB_MAX_USES: 1000,
    SLOW_QUERY_THRESHOLD: 2000,
    
    // Rate Limiting (more permissive for development)
    RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 500,
    
    // CORS (allow localhost for development)
    ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:8081,http://localhost:19006',
    
    // Security (less strict for development)
    TRUST_PROXY: false,
    
    // Frontend
    EXPO_PUBLIC_API_URL: 'http://localhost:3001/api',
    EXPO_PUBLIC_APP_NAME: 'Ladder (Dev)',
    EXPO_PUBLIC_APP_VERSION: '1.0.0-dev',
    EXPO_PUBLIC_DEBUG_MODE: 'true',
    EXPO_PUBLIC_ENABLE_ANALYTICS: 'false',
    EXPO_PUBLIC_ENABLE_CRASH_REPORTING: 'false',
    EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS: 'false',
  },
  
  staging: {
    // Application
    NODE_ENV: 'staging',
    PORT: 3001,
    LOG_LEVEL: 'info',
    
    // Database
    DB_POOL_MAX: 15,
    DB_POOL_MIN: 2,
    DB_IDLE_TIMEOUT: 30000,
    DB_CONNECTION_TIMEOUT: 2000,
    DB_MAX_USES: 5000,
    SLOW_QUERY_THRESHOLD: 1500,
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 200,
    
    // CORS
    ALLOWED_ORIGINS: 'https://ladder-staging.up.railway.app',
    
    // Security
    TRUST_PROXY: true,
    
    // Frontend
    EXPO_PUBLIC_API_URL: 'https://ladder-backend-staging.up.railway.app/api',
    EXPO_PUBLIC_APP_NAME: 'Ladder (Staging)',
    EXPO_PUBLIC_APP_VERSION: '1.0.0-staging',
    EXPO_PUBLIC_DEBUG_MODE: 'true',
    EXPO_PUBLIC_ENABLE_ANALYTICS: 'false',
    EXPO_PUBLIC_ENABLE_CRASH_REPORTING: 'true',
    EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS: 'false',
  },
  
  production: {
    // Application
    NODE_ENV: 'production',
    PORT: 3001,
    LOG_LEVEL: 'info',
    
    // Database
    DB_POOL_MAX: 20,
    DB_POOL_MIN: 5,
    DB_IDLE_TIMEOUT: 30000,
    DB_CONNECTION_TIMEOUT: 2000,
    DB_MAX_USES: 7500,
    SLOW_QUERY_THRESHOLD: 1000,
    
    // Rate Limiting (stricter for production)
    RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100,
    
    // CORS
    ALLOWED_ORIGINS: 'https://ladder-production.up.railway.app',
    
    // Security
    TRUST_PROXY: true,
    
    // Frontend
    EXPO_PUBLIC_API_URL: 'https://ladder-backend-production.up.railway.app/api',
    EXPO_PUBLIC_APP_NAME: 'Ladder',
    EXPO_PUBLIC_APP_VERSION: '1.0.0',
    EXPO_PUBLIC_DEBUG_MODE: 'false',
    EXPO_PUBLIC_ENABLE_ANALYTICS: 'true',
    EXPO_PUBLIC_ENABLE_CRASH_REPORTING: 'true',
    EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS: 'true',
  },
  
  test: {
    // Application
    NODE_ENV: 'test',
    PORT: 3002,
    LOG_LEVEL: 'error',
    
    // Database
    DB_POOL_MAX: 5,
    DB_POOL_MIN: 1,
    DB_IDLE_TIMEOUT: 5000,
    DB_CONNECTION_TIMEOUT: 1000,
    DB_MAX_USES: 100,
    SLOW_QUERY_THRESHOLD: 5000,
    
    // Rate Limiting (very permissive for tests)
    RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
    RATE_LIMIT_MAX_REQUESTS: 1000,
    
    // CORS
    ALLOWED_ORIGINS: 'http://localhost:3000',
    
    // Security
    TRUST_PROXY: false,
    
    // Frontend
    EXPO_PUBLIC_API_URL: 'http://localhost:3002/api',
    EXPO_PUBLIC_APP_NAME: 'Ladder (Test)',
    EXPO_PUBLIC_APP_VERSION: '1.0.0-test',
    EXPO_PUBLIC_DEBUG_MODE: 'true',
    EXPO_PUBLIC_ENABLE_ANALYTICS: 'false',
    EXPO_PUBLIC_ENABLE_CRASH_REPORTING: 'false',
    EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS: 'false',
  }
};

// Required environment variables that must be set by the user
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS',
  'ADMIN_EMAIL',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD'
];

// Optional environment variables with validation rules
const optionalEnvVars = {
  JWT_EXPIRES_IN: { default: '7d', type: 'string' },
  JWT_ISSUER: { default: 'ladder-backend', type: 'string' },
  JWT_AUDIENCE: { default: 'ladder-app', type: 'string' },
  DATABASE_SSL_CA: { default: '', type: 'string' },
  DATABASE_SSL_CERT: { default: '', type: 'string' },
  DATABASE_SSL_KEY: { default: '', type: 'string' },
  DATABASE_SSL_REJECT_UNAUTHORIZED: { default: 'true', type: 'boolean' },
  AWS_ACCESS_KEY_ID: { default: '', type: 'string' },
  AWS_SECRET_ACCESS_KEY: { default: '', type: 'string' },
  AWS_REGION: { default: 'us-east-1', type: 'string' },
  AWS_S3_BUCKET_NAME: { default: '', type: 'string' },
  CLOUDINARY_CLOUD_NAME: { default: '', type: 'string' },
  CLOUDINARY_API_KEY: { default: '', type: 'string' },
  CLOUDINARY_API_SECRET: { default: '', type: 'string' },
  STORAGE_TYPE: { default: 'local', type: 'string', validValues: ['local', 's3', 'cloudinary'] }
};

module.exports = {
  environments,
  requiredEnvVars,
  optionalEnvVars
};
