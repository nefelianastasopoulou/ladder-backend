#!/usr/bin/env node

/**
 * Update Railway URL in Expo Go configuration
 * Usage: node scripts/update-railway-url.js https://your-app.up.railway.app
 */

const fs = require('fs');
const path = require('path');

const railwayUrl = process.argv[2];

if (!railwayUrl) {
  console.error('❌ Please provide the Railway URL');
  console.log('Usage: node scripts/update-railway-url.js https://your-app.up.railway.app');
  process.exit(1);
}

// Validate URL format
if (!railwayUrl.startsWith('https://') || !railwayUrl.includes('railway.app')) {
  console.error('❌ Invalid Railway URL format');
  console.log('Expected format: https://your-app.up.railway.app');
  process.exit(1);
}

const apiUrl = railwayUrl.endsWith('/api') ? railwayUrl : `${railwayUrl}/api`;
const envExpoGoPath = path.join(__dirname, '..', '.env.expo-go');

try {
  // Read current .env.expo-go file
  let content = fs.readFileSync(envExpoGoPath, 'utf8');
  
  // Update the API URL
  content = content.replace(
    /EXPO_PUBLIC_API_URL=.*/,
    `EXPO_PUBLIC_API_URL=${apiUrl}`
  );
  
  // Write back to file
  fs.writeFileSync(envExpoGoPath, content);
  
  console.log('✅ Successfully updated .env.expo-go');
  console.log(`📱 API URL: ${apiUrl}`);
  console.log('🚀 You can now test with Expo Go!');
  
} catch (error) {
  console.error('❌ Error updating .env.expo-go:', error.message);
  process.exit(1);
}
