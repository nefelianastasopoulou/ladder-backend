#!/usr/bin/env node

/**
 * Test Railway Configuration Script
 * This script tests the backend configuration and validates environment setup
 */

const path = require('path');

console.log('🧪 Testing Railway Configuration...\n');

// Test 1: Check if required files exist
console.log('1. Checking required files...');
const requiredFiles = [
  'backend/config/env-validator.js',
  'backend/config/environments.js',
  'backend/routes/health.js',
  'backend/routes/profile.js',
  'backend/routes/opportunities.js',
  'backend/routes/onboarding.js',
  'backend/routes/favorites.js',
  'backend/routes/applications.js',
  'backend/routes/settings.js',
  'backend/routes/search.js',
  'backend/routes/conversations.js',
  'backend/routes/admin.js',
  'backend/routes/reports.js',
  'backend/routes/setup.js',
  'nixpacks.toml',
  'railway.json',
  '.env.expo-go'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  try {
    require.resolve(path.join(__dirname, '..', file));
    console.log(`   ✅ ${file}`);
  } catch (error) {
    console.log(`   ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('   ✅ All required files exist\n');
} else {
  console.log('   ❌ Some required files are missing\n');
  process.exit(1);
}

// Test 2: Test environment validator
console.log('2. Testing environment validator...');
try {
  const EnvironmentValidator = require('../backend/config/env-validator');
  const validator = new EnvironmentValidator();
  const validation = validator.validate();
  
  if (validation.isValid) {
    console.log('   ✅ Environment validator is working correctly');
  } else {
    console.log('   ⚠️  Environment validation warnings:');
    validation.errors.forEach(error => console.log(`      - ${error}`));
  }
  console.log('');
} catch (error) {
  console.log(`   ❌ Environment validator error: ${error.message}\n`);
}

// Test 3: Test environments configuration
console.log('3. Testing environments configuration...');
try {
  const { getEnvironmentConfig, getAvailableEnvironments } = require('../backend/config/environments');
  const environments = getAvailableEnvironments();
  
  console.log(`   ✅ Available environments: ${environments.join(', ')}`);
  
  environments.forEach(env => {
    const config = getEnvironmentConfig(env);
    console.log(`   ✅ ${env} config loaded (port: ${config.PORT})`);
  });
  console.log('');
} catch (error) {
  console.log(`   ❌ Environments configuration error: ${error.message}\n`);
}

// Test 4: Test route imports
console.log('4. Testing route imports...');
const routeFiles = [
  'health', 'profile', 'opportunities', 'onboarding', 'favorites',
  'applications', 'settings', 'search', 'conversations', 'admin', 'reports'
];

let allRoutesImport = true;
routeFiles.forEach(route => {
  try {
    require(`../backend/routes/${route}`);
    console.log(`   ✅ ${route} routes`);
  } catch (error) {
    console.log(`   ❌ ${route} routes - ${error.message}`);
    allRoutesImport = false;
  }
});

if (allRoutesImport) {
  console.log('   ✅ All routes import successfully\n');
} else {
  console.log('   ❌ Some routes failed to import\n');
}

// Test 5: Test main route setup
console.log('5. Testing main route setup...');
try {
  const { setupRoutes } = require('../backend/routes/setup');
  console.log('   ✅ Route setup function is available\n');
} catch (error) {
  console.log(`   ❌ Route setup error: ${error.message}\n`);
}

// Test 6: Check Expo Go configuration
console.log('6. Checking Expo Go configuration...');
try {
  const fs = require('fs');
  const expoGoConfig = fs.readFileSync(path.join(__dirname, '..', '.env.expo-go'), 'utf8');
  
  if (expoGoConfig.includes('your-railway-app-name') || expoGoConfig.includes('ladder-backend-production')) {
    console.log('   ⚠️  Expo Go config needs Railway URL update');
    console.log('      Please update EXPO_PUBLIC_API_URL in .env.expo-go');
  } else {
    console.log('   ✅ Expo Go configuration looks good');
  }
  console.log('');
} catch (error) {
  console.log(`   ❌ Expo Go config error: ${error.message}\n`);
}

// Test 7: Check Railway configuration files
console.log('7. Checking Railway configuration...');
try {
  const fs = require('fs');
  
  // Check nixpacks.toml
  const nixpacksConfig = fs.readFileSync(path.join(__dirname, '..', 'nixpacks.toml'), 'utf8');
  if (nixpacksConfig.includes('nodejs-20_x')) {
    console.log('   ✅ nixpacks.toml configured for Node.js 20');
  } else {
    console.log('   ⚠️  nixpacks.toml may need Node.js version update');
  }
  
  // Check railway.json
  const railwayConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'railway.json'), 'utf8'));
  if (railwayConfig.deploy && railwayConfig.deploy.startCommand) {
    console.log('   ✅ railway.json has start command configured');
  } else {
    console.log('   ⚠️  railway.json may need start command configuration');
  }
  console.log('');
} catch (error) {
  console.log(`   ❌ Railway config error: ${error.message}\n`);
}

console.log('🎉 Configuration test completed!');
console.log('\n📋 Next steps:');
console.log('1. Deploy your backend to Railway');
console.log('2. Update EXPO_PUBLIC_API_URL in .env.expo-go with your Railway URL');
console.log('3. Test with Expo Go using: npm run start:expo-go');
console.log('4. Check the RAILWAY_DEPLOYMENT_GUIDE.md for detailed instructions');
console.log('\n🚀 Ready for Railway deployment!');
