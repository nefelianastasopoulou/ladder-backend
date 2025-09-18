#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const EnvironmentValidator = require('../config/env-validator');
const { environments } = require('../config/environments');

class EnvironmentSetup {
  constructor() {
    this.validator = new EnvironmentValidator();
  }

  // Main setup function
  async setup(environment) {
    console.log(`🚀 Setting up environment: ${environment.toUpperCase()}`);
    console.log('=' .repeat(50));

    // Validate environment
    if (!environments[environment]) {
      console.error(`❌ Invalid environment: ${environment}`);
      console.log('Available environments:', Object.keys(environments).join(', '));
      process.exit(1);
    }

    // Check if .env already exists
    const envPath = path.join(process.cwd(), '.env');
    const envExists = fs.existsSync(envPath);

    if (envExists) {
      console.log('📁 Found existing .env file');
      const backupPath = `${envPath}.backup.${Date.now()}`;
      fs.copyFileSync(envPath, backupPath);
      console.log(`💾 Backed up to: ${backupPath}`);
    }

    // Generate new .env file
    try {
      const envContent = this.generateEnvContent(environment);
      fs.writeFileSync(envPath, envContent);
      console.log(`✅ Created .env file for ${environment} environment`);
      console.log(`📁 File location: ${envPath}`);
    } catch (error) {
      console.error(`❌ Error creating .env file: ${error.message}`);
      process.exit(1);
    }

    // Validate the new configuration
    console.log('\n🔍 Validating environment configuration...');
    const validation = this.validator.validate();
    
    if (validation.isValid) {
      console.log('✅ Environment validation passed!');
    } else {
      console.log('❌ Environment validation failed:');
      validation.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }

    if (validation.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      validation.warnings.forEach(warning => {
        console.log(`   • ${warning}`);
      });
    }

    // Show next steps
    this.showNextSteps(environment, validation.isValid);
  }

  generateEnvContent(environment) {
    const envConfig = environments[environment];
    const lines = [];
    
    // Add header
    lines.push(`# Environment Configuration for ${environment.toUpperCase()}`);
    lines.push(`# Generated on ${new Date().toISOString()}`);
    lines.push(`# Run "npm run validate-env" to validate this configuration`);
    lines.push('');
    
    // Add required variables section
    lines.push('# ===========================================');
    lines.push('# REQUIRED VARIABLES (must be set)');
    lines.push('# ===========================================');
    lines.push('');
    
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET', 
      'EMAIL_USER',
      'EMAIL_PASS',
      'ADMIN_EMAIL',
      'ADMIN_USERNAME',
      'ADMIN_PASSWORD'
    ];
    
    requiredVars.forEach(varName => {
      const currentValue = process.env[varName];
      if (currentValue) {
        lines.push(`${varName}=${currentValue}`);
      } else {
        lines.push(`# ${varName}=your-${varName.toLowerCase().replace(/_/g, '-')}-here`);
      }
    });
    
    lines.push('');
    
    // Add environment-specific variables
    lines.push('# ===========================================');
    lines.push('# ENVIRONMENT-SPECIFIC VARIABLES');
    lines.push('# ===========================================');
    lines.push('');
    
    Object.entries(envConfig).forEach(([key, value]) => {
      const currentValue = process.env[key];
      if (currentValue) {
        lines.push(`${key}=${currentValue}`);
      } else {
        if (typeof value === 'string' && value.includes(' ')) {
          lines.push(`${key}="${value}"`);
        } else {
          lines.push(`${key}=${value}`);
        }
      }
    });
    
    lines.push('');
    
    // Add optional variables section
    lines.push('# ===========================================');
    lines.push('# OPTIONAL VARIABLES');
    lines.push('# ===========================================');
    lines.push('');
    
    const optionalVars = {
      'JWT_EXPIRES_IN': '7d',
      'JWT_ISSUER': 'ladder-backend',
      'JWT_AUDIENCE': 'ladder-app',
      'DATABASE_SSL_CA': '',
      'DATABASE_SSL_CERT': '',
      'DATABASE_SSL_KEY': '',
      'DATABASE_SSL_REJECT_UNAUTHORIZED': 'true',
      'AWS_ACCESS_KEY_ID': '',
      'AWS_SECRET_ACCESS_KEY': '',
      'AWS_REGION': 'us-east-1',
      'AWS_S3_BUCKET_NAME': '',
      'CLOUDINARY_CLOUD_NAME': '',
      'CLOUDINARY_API_KEY': '',
      'CLOUDINARY_API_SECRET': '',
      'STORAGE_TYPE': 'local'
    };
    
    Object.entries(optionalVars).forEach(([varName, defaultValue]) => {
      const currentValue = process.env[varName];
      if (currentValue) {
        lines.push(`${varName}=${currentValue}`);
      } else {
        lines.push(`# ${varName}=${defaultValue}`);
      }
    });
    
    lines.push('');
    lines.push('# ===========================================');
    lines.push('# END OF CONFIGURATION');
    lines.push('# ===========================================');
    
    return lines.join('\n');
  }

  showNextSteps(environment, isValid) {
    console.log('\n📋 Next Steps:');
    console.log('=' .repeat(30));
    
    if (!isValid) {
      console.log('1. Edit the .env file and set all required variables');
      console.log('2. Run "npm run validate-env" to check your configuration');
      console.log('3. Run "npm run dev" to start the development server');
    } else {
      console.log('1. Your environment is ready!');
      console.log('2. Run "npm run dev" to start the development server');
    }
    
    console.log('\n💡 Useful commands:');
    console.log('   npm run validate-env     - Validate environment configuration');
    console.log('   npm run setup:dev        - Setup development environment');
    console.log('   npm run setup:staging    - Setup staging environment');
    console.log('   npm run setup:prod       - Setup production environment');
    
    console.log('\n🔧 Environment-specific commands:');
    if (environment === 'development') {
      console.log('   npm run dev              - Start development server');
      console.log('   npm run db:migrate       - Run database migrations');
      console.log('   npm run db:seed          - Seed database with test data');
    } else if (environment === 'production') {
      console.log('   npm start                - Start production server');
      console.log('   npm run db:migrate       - Run database migrations');
    }
  }

  showHelp() {
    console.log(`
🔧 Environment Setup Script

Usage:
  node scripts/setup-environment.js <environment>

Environments:
  development  - Development environment with debug mode enabled
  staging      - Staging environment for testing
  production   - Production environment with analytics enabled
  test         - Test environment for running tests

Examples:
  node scripts/setup-environment.js development
  node scripts/setup-environment.js production

Features:
  ✅ Automatic backup of existing .env files
  ✅ Environment-specific default values
  ✅ Comprehensive validation
  ✅ Clear next steps guidance
  ✅ Support for all required and optional variables
`);
  }
}

// Main execution
async function main() {
  const environment = process.argv[2];
  const setup = new EnvironmentSetup();

  if (!environment || environment === '--help' || environment === '-h') {
    setup.showHelp();
    process.exit(0);
  }

  try {
    await setup.setup(environment);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = EnvironmentSetup;
