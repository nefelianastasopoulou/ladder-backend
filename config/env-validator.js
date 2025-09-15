/**
 * Environment Variable Validation System
 * Validates all required environment variables at startup
 */

const requiredEnvVars = {
  JWT_SECRET: {
    required: true,
    minLength: 32,
    description: 'JWT secret for token signing'
  },
  DATABASE_URL: {
    required: true,
    pattern: /^postgresql:\/\//,
    description: 'PostgreSQL database connection URL'
  },
  EMAIL_USER: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    description: 'Email service username'
  },
  EMAIL_PASS: {
    required: true,
    minLength: 8,
    description: 'Email service password'
  },
  ADMIN_EMAIL: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    description: 'Admin user email address'
  },
  ADMIN_USERNAME: {
    required: true,
    minLength: 3,
    maxLength: 20,
    description: 'Admin username'
  },
  ADMIN_PASSWORD: {
    required: true,
    minLength: 12,
    description: 'Admin password'
  }
};

const optionalEnvVars = {
  NODE_ENV: {
    default: 'development',
    allowedValues: ['development', 'production', 'test'],
    description: 'Application environment'
  },
  PORT: {
    default: '3001',
    type: 'number',
    min: 1000,
    max: 65535,
    description: 'Server port'
  },
  LOG_LEVEL: {
    default: 'info',
    allowedValues: ['error', 'warn', 'info', 'debug'],
    description: 'Logging level'
  }
};

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  validate() {
    this.errors = [];
    this.warnings = [];

    // Validate required variables
    for (const [varName, config] of Object.entries(requiredEnvVars)) {
      const value = process.env[varName];
      
      if (!value) {
        this.errors.push(`Missing required environment variable: ${varName} (${config.description})`);
        continue;
      }

      // Validate minimum length
      if (config.minLength && value.length < config.minLength) {
        this.errors.push(`${varName} must be at least ${config.minLength} characters long`);
      }

      // Validate maximum length
      if (config.maxLength && value.length > config.maxLength) {
        this.errors.push(`${varName} must be no more than ${config.maxLength} characters long`);
      }

      // Validate pattern
      if (config.pattern && !config.pattern.test(value)) {
        this.errors.push(`${varName} format is invalid (${config.description})`);
      }
    }

    // Validate optional variables
    for (const [varName, config] of Object.entries(optionalEnvVars)) {
      const value = process.env[varName] || config.default;

      // Set default if not provided
      if (!process.env[varName] && config.default) {
        process.env[varName] = config.default;
      }

      // Validate allowed values
      if (config.allowedValues && !config.allowedValues.includes(value)) {
        this.errors.push(`${varName} must be one of: ${config.allowedValues.join(', ')}`);
      }

      // Validate type and range
      if (config.type === 'number') {
        const numValue = parseInt(value);
        if (isNaN(numValue)) {
          this.errors.push(`${varName} must be a valid number`);
        } else {
          if (config.min !== undefined && numValue < config.min) {
            this.errors.push(`${varName} must be at least ${config.min}`);
          }
          if (config.max !== undefined && numValue > config.max) {
            this.errors.push(`${varName} must be no more than ${config.max}`);
          }
        }
      }
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  getValidationReport() {
    const result = this.validate();
    
    return {
      isValid: result.isValid,
      errors: result.errors,
      warnings: result.warnings,
      summary: {
        totalRequired: Object.keys(requiredEnvVars).length,
        totalOptional: Object.keys(optionalEnvVars).length,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      }
    };
  }
}

module.exports = EnvironmentValidator;
