/**
 * Environment Variable Validator
 * Validates all required and optional environment variables
 */

const { requiredEnvVars, optionalEnvVars } = require('./environments');

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.isValid = true;
  }

  /**
   * Validate all environment variables
   */
  validate() {
    this.errors = [];
    this.warnings = [];
    this.isValid = true;

    // Validate required environment variables
    this.validateRequired();
    
    // Validate optional environment variables
    this.validateOptional();
    
    // Validate specific formats
    this.validateFormats();
    
    // Validate security requirements
    this.validateSecurity();

    this.isValid = this.errors.length === 0;
    return this.getValidationReport();
  }

  /**
   * Validate required environment variables
   */
  validateRequired() {
    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        this.errors.push(`Required environment variable '${envVar}' is not set`);
      } else if (process.env[envVar].trim() === '') {
        this.errors.push(`Required environment variable '${envVar}' is empty`);
      }
    });
  }

  /**
   * Validate optional environment variables
   */
  validateOptional() {
    Object.entries(optionalEnvVars).forEach(([envVar, config]) => {
      const value = process.env[envVar];
      
      if (value !== undefined) {
        // Validate type
        if (config.type === 'boolean' && !['true', 'false'].includes(value.toLowerCase())) {
          this.warnings.push(`Environment variable '${envVar}' should be 'true' or 'false'`);
        }
        
        // Validate valid values
        if (config.validValues && !config.validValues.includes(value)) {
          this.warnings.push(`Environment variable '${envVar}' should be one of: ${config.validValues.join(', ')}`);
        }
      }
    });
  }

  /**
   * Validate specific formats
   */
  validateFormats() {
    // Validate DATABASE_URL format
    if (process.env.DATABASE_URL) {
      if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
        this.errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
      }
    }

    // Validate JWT_SECRET strength
    if (process.env.JWT_SECRET) {
      if (process.env.JWT_SECRET.length < 32) {
        this.errors.push('JWT_SECRET must be at least 32 characters long for security');
      }
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (process.env.EMAIL_USER && !emailRegex.test(process.env.EMAIL_USER)) {
      this.errors.push('EMAIL_USER must be a valid email address');
    }
    if (process.env.ADMIN_EMAIL && !emailRegex.test(process.env.ADMIN_EMAIL)) {
      this.errors.push('ADMIN_EMAIL must be a valid email address');
    }

    // Validate PORT
    if (process.env.PORT) {
      const port = parseInt(process.env.PORT);
      if (isNaN(port) || port < 1 || port > 65535) {
        this.errors.push('PORT must be a valid port number (1-65535)');
      }
    }

    // Validate numeric environment variables
    const numericVars = [
      'DB_POOL_MAX', 'DB_POOL_MIN', 'DB_IDLE_TIMEOUT', 
      'DB_CONNECTION_TIMEOUT', 'DB_MAX_USES', 'SLOW_QUERY_THRESHOLD',
      'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX_REQUESTS'
    ];

    numericVars.forEach(envVar => {
      if (process.env[envVar]) {
        const value = parseInt(process.env[envVar]);
        if (isNaN(value) || value < 0) {
          this.errors.push(`Environment variable '${envVar}' must be a positive number`);
        }
      }
    });
  }

  /**
   * Validate security requirements
   */
  validateSecurity() {
    // Check for weak passwords
    if (process.env.ADMIN_PASSWORD) {
      if (process.env.ADMIN_PASSWORD.length < 8) {
        this.warnings.push('ADMIN_PASSWORD should be at least 8 characters long');
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(process.env.ADMIN_PASSWORD)) {
        this.warnings.push('ADMIN_PASSWORD should contain uppercase, lowercase, and numbers');
      }
    }

    // Check for development values in production
    if (process.env.NODE_ENV === 'production') {
      const devValues = ['test', 'dev', 'development', 'localhost', '123456', 'password'];
      const sensitiveVars = ['JWT_SECRET', 'ADMIN_PASSWORD', 'EMAIL_PASS'];
      
      sensitiveVars.forEach(envVar => {
        if (process.env[envVar]) {
          devValues.forEach(devValue => {
            if (process.env[envVar].toLowerCase().includes(devValue)) {
              this.warnings.push(`Environment variable '${envVar}' appears to contain development/test values in production`);
            }
          });
        }
      });
    }
  }

  /**
   * Get validation report
   */
  getValidationReport() {
    return {
      isValid: this.isValid,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        requiredVars: requiredEnvVars.length,
        optionalVars: Object.keys(optionalEnvVars).length
      }
    };
  }

  /**
   * Print validation results
   */
  printResults() {
    const report = this.getValidationReport();
    
    console.log('\n🔍 Environment Validation Report');
    console.log('================================');
    
    if (report.isValid) {
      console.log('✅ Environment validation passed!');
    } else {
      console.log('❌ Environment validation failed!');
    }
    
    if (report.errors.length > 0) {
      console.log('\n🚨 Errors:');
      report.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (report.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      report.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Required variables: ${report.summary.requiredVars}`);
    console.log(`   Optional variables: ${report.summary.optionalVars}`);
    console.log(`   Errors: ${report.summary.totalErrors}`);
    console.log(`   Warnings: ${report.summary.totalWarnings}`);
    
    if (report.isValid) {
      console.log('\n🎉 Your environment is ready for deployment!');
    } else {
      console.log('\n💡 Please fix the errors above before deploying.');
    }
  }
}

module.exports = EnvironmentValidator;