#!/usr/bin/env node

/**
 * Generate a secure JWT secret
 * Usage: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

function generateJWTSecret() {
  // Generate a 64-byte (512-bit) random secret
  const secret = crypto.randomBytes(64).toString('hex');
  
  console.log('🔐 Generated JWT Secret:');
  console.log('=' .repeat(50));
  console.log(secret);
  console.log('=' .repeat(50));
  console.log('\n📋 Instructions:');
  console.log('1. Copy the secret above');
  console.log('2. Add it to your .env file as JWT_SECRET=your_secret_here');
  console.log('3. Never share this secret or commit it to version control');
  console.log('\n⚠️  Security Notes:');
  console.log('- This secret is 128 characters long (64 bytes in hex)');
  console.log('- It has high entropy and is cryptographically secure');
  console.log('- Store it securely and rotate it periodically');
  
  return secret;
}

// Run if called directly
if (require.main === module) {
  generateJWTSecret();
}

module.exports = generateJWTSecret;