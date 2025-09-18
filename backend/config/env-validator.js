/**
 * Environment Variables Validator
 * Validates all required environment variables for the Ladder backend
 */

class EnvironmentValidator {
  constructor() {
    this.requiredVars = {
      // Core application variables
      NODE_ENV: { required: true, type: 'string', values: ['development', 'production', 'staging', 'test'] },
      PORT: { required: true, type: 'number', min: 1, max: 65535 },
      
      // Database variables
      DATABASE_URL: { required: true, type: 'string', pattern: /^postgresql:\/\// },
      
      // JWT variables
      JWT_SECRET: { required: true, type: 'string', minLength: 32 },
      
      // Email variables (optional for development)
      EMAIL_USER: { required: false, type: 'string' },
      EMAIL_PASS: { required: false, type: 'string' },
      
      // Admin variables (optional for development)
      ADMIN_EMAIL: { required: false, type: 'string' },
      ADMIN_USERNAME: { required: false, type: 'string' },
      ADMIN_PASSWORD: { required: false, type: 'string' },
    };

    this.optionalVars = {
      // Database pool settings
      DB_POOL_MIN: { type: 'number', default: 1, min: 1, max: 50 },
      DB_POOL_MAX: { type: 'number', default: 10, min: 1, max: 100 },
      DB_IDLE_TIMEOUT: { type: 'number', default: 30000, min: 1000 },
      DB_CONNECTION_TIMEOUT: { type: 'number', default: 2000, min: 1000 },
      DB_MAX_USES: { type: 'number', default: 7500, min: 1 },
      SLOW_QUERY_THRESHOLD: { type: 'number', default: 1000, min: 100 },
      
      // JWT settings
      JWT_EXPIRES_IN: { type: 'string', default: '7d' },
      JWT_ISSUER: { type: 'string', default: 'ladder-backend' },
      JWT_AUDIENCE: { type: 'string', default: 'ladder-app' },
      
      // Rate limiting
      RATE_LIMIT_WINDOW_MS: { type: 'number', default: 900000, min: 60000 },
      RATE_LIMIT_MAX_REQUESTS: { type: 'number', default: 100, min: 1 },
      
      // CORS
      ALLOWED_ORIGINS: { type: 'string', default: '*' },
      
      // Security
      TRUST_PROXY: { type: 'boolean', default: false },
      
      // File storage
      STORAGE_TYPE: { type: 'string', default: 'local', values: ['local', 's3', 'cloudinary'] },
      
      // AWS S3 (if using S3)
      AWS_ACCESS_KEY_ID: { type: 'string', requiredIf: 'STORAGE_TYPE', requiredIfValue: 's3' },
      AWS_SECRET_ACCESS_KEY: { type: 'string', requiredIf: 'STORAGE_TYPE', requiredIfValue: 's3' },
      AWS_REGION: { type: 'string', default: 'us-east-1' },
      AWS_S3_BUCKET_NAME: { type: 'string', requiredIf: 'STORAGE_TYPE', requiredIfValue: 's3' },
      
      // Cloudinary (if using Cloudinary)
      CLOUDINARY_CLOUD_NAME: { type: 'string', requiredIf: 'STORAGE_TYPE', requiredIfValue: 'cloudinary' },
      CLOUDINARY_API_KEY: { type: 'string', requiredIf: 'STORAGE_TYPE', requiredIfValue: 'cloudinary' },
      CLOUDINARY_API_SECRET: { type: 'string', requiredIf: 'STORAGE_TYPE', requiredIfValue: 'cloudinary' },
      
      // SSL settings
      DATABASE_SSL_REJECT_UNAUTHORIZED: { type: 'boolean', default: true },
      DATABASE_SSL_CA: { type: 'string' },
      DATABASE_SSL_CERT: { type: 'string' },
      DATABASE_SSL_KEY: { type: 'string' },
      
      // Logging
      LOG_LEVEL: { type: 'string', default: 'info', values: ['error', 'warn', 'info', 'debug'] },
    };
  }

  validate() {
    const errors = [];
    const warnings = [];
    const isValid = true;

    // Validate required variables
    for (const [varName, config] of Object.entries(this.requiredVars)) {
      const value = process.env[varName];
      
      if (config.required && !value) {
        errors.push(`Required environment variable ${varName} is not set`);
        continue;
      }

      if (value) {
        const validation = this.validateVariable(varName, value, config);
        if (!validation.isValid) {
          errors.push(...validation.errors);
        }
        if (validation.warnings.length > 0) {
          warnings.push(...validation.warnings);
        }
      }
    }

    // Validate optional variables
    for (const [varName, config] of Object.entries(this.optionalVars)) {
      const value = process.env[varName];
      
      // Check conditional requirements
      if (config.requiredIf && config.requiredIfValue) {
        const dependentValue = process.env[config.requiredIf];
        if (dependentValue === config.requiredIfValue && !value) {
          errors.push(`Environment variable ${varName} is required when ${config.requiredIf}=${config.requiredIfValue}`);
          continue;
        }
      }

      if (value) {
        const validation = this.validateVariable(varName, value, config);
        if (!validation.isValid) {
          errors.push(...validation.errors);
        }
        if (validation.warnings.length > 0) {
          warnings.push(...validation.warnings);
        }
      }
    }

    // Environment-specific validations
    this.validateEnvironmentSpecific(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalVariables: Object.keys(this.requiredVars).length + Object.keys(this.optionalVars).length,
        requiredVariables: Object.keys(this.requiredVars).length,
        optionalVariables: Object.keys(this.optionalVars).length,
        errorsCount: errors.length,
        warningsCount: warnings.length
      }
    };
  }

  validateVariable(varName, value, config) {
    const errors = [];
    const warnings = [];

    // Type validation
    if (config.type === 'number') {
      const numValue = parseInt(value);
      if (isNaN(numValue)) {
        errors.push(`${varName} must be a number, got: ${value}`);
        return { isValid: false, errors, warnings };
      }
      
      if (config.min !== undefined && numValue < config.min) {
        errors.push(`${varName} must be at least ${config.min}, got: ${numValue}`);
      }
      if (config.max !== undefined && numValue > config.max) {
        errors.push(`${varName} must be at most ${config.max}, got: ${numValue}`);
      }
    } else if (config.type === 'boolean') {
      if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
        errors.push(`${varName} must be a boolean (true/false), got: ${value}`);
      }
    } else if (config.type === 'string') {
      if (config.minLength && value.length < config.minLength) {
        errors.push(`${varName} must be at least ${config.minLength} characters long`);
      }
      if (config.pattern && !config.pattern.test(value)) {
        errors.push(`${varName} format is invalid`);
      }
      if (config.values && !config.values.includes(value)) {
        errors.push(`${varName} must be one of: ${config.values.join(', ')}, got: ${value}`);
      }
    }

    // Security warnings
    if (varName.includes('SECRET') || varName.includes('PASSWORD') || varName.includes('KEY')) {
      if (value.length < 16) {
        warnings.push(`${varName} should be at least 16 characters long for security`);
      }
      if (value === 'your-secret-key' || value === 'password' || value === 'secret') {
        warnings.push(`${varName} appears to be using a default/weak value`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateEnvironmentSpecific(errors, warnings) {
    const nodeEnv = process.env.NODE_ENV;

    // Production-specific validations
    if (nodeEnv === 'production') {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        warnings.push('Email configuration is recommended for production');
      }
      
      if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        warnings.push('Admin configuration is recommended for production');
      }

      if (process.env.TRUST_PROXY !== 'true') {
        warnings.push('TRUST_PROXY should be true in production when behind a proxy');
      }

      if (process.env.LOG_LEVEL === 'debug') {
        warnings.push('LOG_LEVEL should not be debug in production');
      }
    }

    // Development-specific validations
    if (nodeEnv === 'development') {
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('production')) {
        warnings.push('Using production database URL in development environment');
      }
    }

    // Railway-specific validations
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')) {
      if (process.env.DB_POOL_MAX && parseInt(process.env.DB_POOL_MAX) > 20) {
        warnings.push('Railway has connection limits, consider reducing DB_POOL_MAX');
      }
    }
  }

  getValidationReport() {
    return this.validate();
  }

  // Helper method to get default values
  getDefaults() {
    const defaults = {};
    
    for (const [varName, config] of Object.entries(this.optionalVars)) {
      if (config.default !== undefined) {
        defaults[varName] = config.default;
      }
    }
    
    return defaults;
  }

  // Helper method to check if a variable is required
  isRequired(varName) {
    return this.requiredVars[varName]?.required || false;
  }

  // Helper method to get variable type
  getVariableType(varName) {
    return this.requiredVars[varName]?.type || this.optionalVars[varName]?.type || 'string';
  }
}

module.exports = EnvironmentValidator;
