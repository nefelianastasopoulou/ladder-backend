#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking project compatibility...\n');

// Check package.json files
let frontendPackage, backendPackage;

try {
  frontendPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
} catch (error) {
  console.error('❌ Error parsing frontend package.json:', error.message);
  process.exit(1);
}

try {
  backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
} catch (error) {
  console.error('❌ Error parsing backend package.json:', error.message);
  process.exit(1);
}

console.log('📱 Frontend Dependencies:');
console.log(`   Expo SDK: ${frontendPackage.dependencies.expo}`);
console.log(`   React Native: ${frontendPackage.dependencies['react-native']}`);
console.log(`   React: ${frontendPackage.dependencies.react}`);
console.log(`   Node.js Requirement: ${frontendPackage.engines?.node || 'Not specified'}`);

console.log('\n🔧 Backend Dependencies:');
console.log(`   Node.js Requirement: ${backendPackage.engines?.node || 'Not specified'}`);
console.log(`   Express: ${backendPackage.dependencies.express}`);
console.log(`   PostgreSQL: ${backendPackage.dependencies.pg}`);

// Check compatibility
const expoVersion = frontendPackage.dependencies.expo.replace('~', '').replace('^', '');
const reactNativeVersion = frontendPackage.dependencies['react-native'];

console.log('\n✅ Compatibility Check:');

// Expo SDK 54 compatibility
if (expoVersion.startsWith('54')) {
  console.log('   ✅ Expo SDK 54 detected');
  
  // Check React Native version (remove version prefixes)
  const cleanRNVersion = reactNativeVersion.replace(/^[\^~]/, '');
  if (cleanRNVersion.startsWith('0.73')) {
    console.log('   ✅ React Native 0.73.x - Compatible with Expo SDK 54');
  } else if (cleanRNVersion.startsWith('0.74')) {
    console.log('   ✅ React Native 0.74.x - Compatible with Expo SDK 54');
  } else {
    console.log('   ❌ React Native version may not be compatible');
  }
} else {
  console.log('   ❌ Expo SDK version not recognized');
}

// Node.js version check
const frontendNodeVersion = frontendPackage.engines?.node;
const backendNodeVersion = backendPackage.engines?.node;

if (frontendNodeVersion && frontendNodeVersion.includes('20')) {
  console.log('   ✅ Frontend requires Node.js 20+');
} else {
  console.log('   ⚠️  Frontend Node.js version not specified or < 20');
}

if (backendNodeVersion && backendNodeVersion.includes('20')) {
  console.log('   ✅ Backend requires Node.js 20+');
} else {
  console.log('   ⚠️  Backend Node.js version not specified or < 20');
}

// Check for potential issues
console.log('\n🔍 Potential Issues:');

// Check for expo in backend
if (backendPackage.dependencies.expo) {
  console.log('   ❌ Backend has expo dependency - should be removed');
} else {
  console.log('   ✅ Backend does not have expo dependency');
}

// Check for font loading
const layoutFile = fs.readFileSync('app/_layout.tsx', 'utf8');
if (layoutFile.includes('useFonts')) {
  console.log('   ⚠️  Font loading detected - may cause issues in Expo Go');
} else {
  console.log('   ✅ No font loading issues detected');
}

console.log('\n📋 Recommendations:');
console.log('   1. Run: npm install (to update dependencies)');
console.log('   2. Test in Expo Go thoroughly');
console.log('   3. Set NIXPACKS_NODE_VERSION=20 in Railway');
console.log('   4. Verify all environment variables are set in Railway');
console.log('   5. Test production build with: npm run build');

console.log('\n🎉 Compatibility check complete!');
