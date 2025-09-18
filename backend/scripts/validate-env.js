#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * This script validates all required environment variables and their formats
 */

// const path = require('path'); // Unused import
const EnvironmentValidator = require('../../config/env-validator');

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Validate environment
const validator = new EnvironmentValidator();
const validation = validator.validate();

// Print detailed results
validator.printResults();

if (!validation.isValid) {
  console.log('\n❌ Environment validation failed!');
  console.log('Please fix the errors above and try again.');
  console.log('\n💡 Run "npm run setup-env <environment>" to generate a new .env file.');
  process.exit(1);
}

console.log('\n🎉 Environment is ready to use!');

// Export for use in other scripts
module.exports = { validator, validation };