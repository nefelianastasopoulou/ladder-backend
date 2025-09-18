#!/usr/bin/env node

/**
 * JWT Secret Generator
 * Generates a secure random JWT secret for production use
 */

const crypto = require('crypto');

function generateJWTSecret() {
  // Generate a 64-byte random string and encode as base64
  const secret = crypto.randomBytes(64).toString('base64');
  
  console.log('🔐 Generated JWT Secret:');
  console.log('='.repeat(80));
  console.log(secret);
  console.log('='.repeat(80));
  console.log('');
  console.log('📝 Add this to your environment variables:');
  console.log(`JWT_SECRET=${secret}`);
  console.log('');
  console.log('⚠️  Keep this secret secure and never commit it to version control!');
  console.log('💡 For Railway, add this as an environment variable in your project settings.');
  
  return secret;
}

// Generate and display the secret
generateJWTSecret();
