#!/usr/bin/env node

/**
 * Railway Environment Setup Helper
 * This script helps you set up environment variables for Railway deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Railway Environment Setup Helper\n');

// Read the Railway environment template
const envPath = path.join(__dirname, '..', 'backend', '.env.railway');
const envContent = fs.readFileSync(envPath, 'utf8');

console.log('📋 Environment Variables to set in Railway Dashboard:\n');
console.log('Copy and paste these into your Railway project Variables tab:\n');

// Parse and display environment variables
const lines = envContent.split('\n');
let currentSection = '';

lines.forEach(line => {
  // Skip comments and empty lines
  if (line.trim().startsWith('#') || line.trim() === '') {
    if (line.trim().startsWith('# =====')) {
      currentSection = line.trim();
      console.log(`\n${currentSection}`);
    }
    return;
  }

  // Display environment variable
  if (line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');
    console.log(`${key.trim()}=${value.trim()}`);
  }
});

console.log('\n🔧 Setup Instructions:');
console.log('1. Go to your Railway project dashboard');
console.log('2. Navigate to the "Variables" tab');
console.log('3. Add each environment variable listed above');
console.log('4. Make sure to replace "https://your-app.railway.app" with your actual Railway app URL');
console.log('5. Connect a PostgreSQL service to your project (Railway will set DATABASE_URL automatically)');
console.log('6. Deploy your application');

console.log('\n⚠️  Important Notes:');
console.log('- Do NOT commit the .env.railway file to version control');
console.log('- Railway will automatically set DATABASE_URL when you connect PostgreSQL');
console.log('- Update ALLOWED_ORIGINS with your actual Railway app URL');
console.log('- The JWT_SECRET should be changed for production use');

console.log('\n✅ After setting up environment variables, your Railway deployment should work!');
