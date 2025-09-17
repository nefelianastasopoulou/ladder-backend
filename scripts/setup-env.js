#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Environment setup script
const environments = {
  development: {
    EXPO_PUBLIC_API_URL: 'https://ladder-backend-production.up.railway.app/api',
    EXPO_PUBLIC_APP_NAME: 'Ladder (Dev)',
    EXPO_PUBLIC_APP_VERSION: '1.0.0-dev',
    EXPO_PUBLIC_DEBUG_MODE: 'true',
    EXPO_PUBLIC_ENABLE_ANALYTICS: 'false',
    EXPO_PUBLIC_ENABLE_CRASH_REPORTING: 'false',
    EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS: 'false',
  },
  staging: {
    EXPO_PUBLIC_API_URL: 'https://ladder-backend-staging.up.railway.app/api',
    EXPO_PUBLIC_APP_NAME: 'Ladder (Staging)',
    EXPO_PUBLIC_APP_VERSION: '1.0.0-staging',
    EXPO_PUBLIC_DEBUG_MODE: 'true',
    EXPO_PUBLIC_ENABLE_ANALYTICS: 'false',
    EXPO_PUBLIC_ENABLE_CRASH_REPORTING: 'true',
    EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS: 'false',
  },
  production: {
    EXPO_PUBLIC_API_URL: 'https://ladder-backend-production.up.railway.app/api',
    EXPO_PUBLIC_APP_NAME: 'Ladder',
    EXPO_PUBLIC_APP_VERSION: '1.0.0',
    EXPO_PUBLIC_DEBUG_MODE: 'false',
    EXPO_PUBLIC_ENABLE_ANALYTICS: 'true',
    EXPO_PUBLIC_ENABLE_CRASH_REPORTING: 'true',
    EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS: 'true',
  },
};

function createEnvFile(environment) {
  const envConfig = environments[environment];
  if (!envConfig) {
    console.error(`❌ Unknown environment: ${environment}`);
    console.log('Available environments: development, staging, production');
    process.exit(1);
  }

  const envContent = Object.entries(envConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const envPath = path.join(process.cwd(), '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Created .env file for ${environment} environment`);
    console.log(`📁 File location: ${envPath}`);
    console.log(`🔧 API URL: ${envConfig.EXPO_PUBLIC_API_URL}`);
  } catch (error) {
    console.error(`❌ Error creating .env file: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🔧 Environment Setup Script

Usage:
  node scripts/setup-env.js <environment>

Environments:
  development  - Development environment with debug mode enabled
  staging      - Staging environment for testing
  production   - Production environment with analytics enabled

Examples:
  node scripts/setup-env.js development
  node scripts/setup-env.js production
`);
}

// Main execution
const environment = process.argv[2];

if (!environment) {
  showHelp();
  process.exit(1);
}

createEnvFile(environment);
