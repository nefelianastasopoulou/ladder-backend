/**
 * Environment-specific configuration defaults
 * Provides default values for different environments
 */

const environments = {
  development: {
    NODE_ENV: 'development',
    PORT: 3001,
    LOG_LEVEL: 'debug',
    
    // Database settings (development)
    DB_POOL_MIN: 1,
    DB_POOL_MAX: 5,
    DB_IDLE_TIMEOUT: 30000,
    DB_CONNECTION_TIMEOUT: 2000,
    DB_MAX_USES: 2000,
    SLOW_QUERY_THRESHOLD: 2000,
    
    // JWT settings
    JWT_EXPIRES_IN: '7d',
    JWT_ISSUER: 'ladder-backend-dev',
    JWT_AUDIENCE: 'ladder-app-dev',
    
    // Rate limiting (more lenient for development)
    RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 1000,
    
    // CORS (allow all origins in development)
    ALLOWED_ORIGINS: '*',
    
    // Security (less strict for development)
    TRUST_PROXY: false,
    
    // File storage (local for development)
    STORAGE_TYPE: 'local',
    
    // SSL (disabled for local development)
    DATABASE_SSL_REJECT_UNAUTHORIZED: false,
  },

  staging: {
    NODE_ENV: 'staging',
    PORT: 3001,
    LOG_LEVEL: 'info',
    
    // Database settings (staging)
    DB_POOL_MIN: 2,
    DB_POOL_MAX: 10,
    DB_IDLE_TIMEOUT: 20000,
    DB_CONNECTION_TIMEOUT: 5000,
    DB_MAX_USES: 5000,
    SLOW_QUERY_THRESHOLD: 1500,
    
    // JWT settings
    JWT_EXPIRES_IN: '7d',
    JWT_ISSUER: 'ladder-backend-staging',
    JWT_AUDIENCE: 'ladder-app-staging',
    
    // Rate limiting
    RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 500,
    
    // CORS (specific origins for staging - includes Expo Go)
    ALLOWED_ORIGINS: 'https://ladder-backend-production.up.railway.app,exp://192.168.1.100:8081,exp://localhost:8081',
    
    // Security
    TRUST_PROXY: true,
    
    // File storage (can use cloud storage for staging)
    STORAGE_TYPE: 'local',
    
    // SSL (enabled for staging)
    DATABASE_SSL_REJECT_UNAUTHORIZED: true,
  },

  production: {
    NODE_ENV: 'production',
    PORT: 3001,
    LOG_LEVEL: 'warn',
    
    // Database settings (production - Railway optimized)
    DB_POOL_MIN: 2,
    DB_POOL_MAX: 15,
    DB_IDLE_TIMEOUT: 20000,
    DB_CONNECTION_TIMEOUT: 5000,
    DB_MAX_USES: 5000,
    SLOW_QUERY_THRESHOLD: 1000,
    
    // JWT settings
    JWT_EXPIRES_IN: '7d',
    JWT_ISSUER: 'ladder-backend',
    JWT_AUDIENCE: 'ladder-app',
    
    // Rate limiting (stricter for production)
    RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100,
    
    // CORS (specific origins for production - mobile apps don't send origin)
    ALLOWED_ORIGINS: 'https://ladder-backend-production.up.railway.app',
    
    // Security (strict for production)
    TRUST_PROXY: true,
    
    // File storage (cloud storage recommended for production)
    STORAGE_TYPE: 'local',
    
    // SSL (enabled for production)
    DATABASE_SSL_REJECT_UNAUTHORIZED: true,
  },

  test: {
    NODE_ENV: 'test',
    PORT: 3002,
    LOG_LEVEL: 'error',
    
    // Database settings (test)
    DB_POOL_MIN: 1,
    DB_POOL_MAX: 2,
    DB_IDLE_TIMEOUT: 10000,
    DB_CONNECTION_TIMEOUT: 1000,
    DB_MAX_USES: 100,
    SLOW_QUERY_THRESHOLD: 500,
    
    // JWT settings
    JWT_EXPIRES_IN: '1h',
    JWT_ISSUER: 'ladder-backend-test',
    JWT_AUDIENCE: 'ladder-app-test',
    
    // Rate limiting (very lenient for tests)
    RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
    RATE_LIMIT_MAX_REQUESTS: 10000,
    
    // CORS (allow all for tests)
    ALLOWED_ORIGINS: '*',
    
    // Security (relaxed for tests)
    TRUST_PROXY: false,
    
    // File storage (local for tests)
    STORAGE_TYPE: 'local',
    
    // SSL (disabled for tests)
    DATABASE_SSL_REJECT_UNAUTHORIZED: false,
  }
};

// Helper function to get environment config
const getEnvironmentConfig = (env = process.env.NODE_ENV || 'development') => {
  return environments[env] || environments.development;
};

// Helper function to merge environment config with process.env
const mergeWithEnvironment = (env = process.env.NODE_ENV || 'development') => {
  const envConfig = getEnvironmentConfig(env);
  const merged = { ...envConfig };
  
  // Override with actual environment variables if they exist
  for (const key in merged) {
    if (process.env[key] !== undefined) {
      // Convert string values to appropriate types
      if (typeof merged[key] === 'number') {
        merged[key] = parseInt(process.env[key]) || merged[key];
      } else if (typeof merged[key] === 'boolean') {
        merged[key] = process.env[key] === 'true' || process.env[key] === '1';
      } else {
        merged[key] = process.env[key];
      }
    }
  }
  
  return merged;
};

// Helper function to validate environment
const validateEnvironment = (env) => {
  const validEnvironments = Object.keys(environments);
  if (!validEnvironments.includes(env)) {
    throw new Error(`Invalid environment: ${env}. Valid environments are: ${validEnvironments.join(', ')}`);
  }
  return true;
};

// Helper function to get all available environments
const getAvailableEnvironments = () => {
  return Object.keys(environments);
};

// Helper function to check if we're in a specific environment
const isEnvironment = (env) => {
  return process.env.NODE_ENV === env;
};

// Helper function to check if we're in production
const isProduction = () => {
  return isEnvironment('production');
};

// Helper function to check if we're in development
const isDevelopment = () => {
  return isEnvironment('development');
};

// Helper function to check if we're in staging
const isStaging = () => {
  return isEnvironment('staging');
};

// Helper function to check if we're in test
const isTest = () => {
  return isEnvironment('test');
};

module.exports = {
  environments,
  getEnvironmentConfig,
  mergeWithEnvironment,
  validateEnvironment,
  getAvailableEnvironments,
  isEnvironment,
  isProduction,
  isDevelopment,
  isStaging,
  isTest
};
