#!/usr/bin/env node

/**
 * Local Development Setup Script
 * This script helps set up the backend for local development
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Setting up Ladder Backend for Local Development...\n');

// Check if .env.local exists
const envLocalPath = path.join(__dirname, '.env.local');
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envLocalPath)) {
  console.log('❌ .env.local file not found!');
  console.log('📝 Please create .env.local with your local database configuration.');
  console.log('   You can copy from .env.example and modify the DATABASE_URL.');
  process.exit(1);
}

// Read .env.local
const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');

// Generate secure JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

// Replace placeholder values
let updatedContent = envLocalContent
  .replace('dev_jwt_secret_for_local_development_only_change_in_production', jwtSecret)
  .replace('admin123', 'LocalDevAdmin123!');

// Write to .env for local development
fs.writeFileSync(envPath, updatedContent);

console.log('✅ Local development environment configured!');
console.log('🔑 Generated secure JWT secret');
console.log('🔐 Set admin password to: LocalDevAdmin123!');
console.log('\n📋 Next steps:');
console.log('1. Set up your local PostgreSQL database');
console.log('2. Update DATABASE_URL in .env with your database credentials');
console.log('3. Run: npm run migrate');
console.log('4. Run: npm run dev');
console.log('\n💡 For PostgreSQL setup:');
console.log('   - Install PostgreSQL locally');
console.log('   - Create database: ladder_dev');
console.log('   - Update DATABASE_URL in .env');
console.log('\n🌐 For Railway deployment:');
console.log('   - Use the production .env configuration');
console.log('   - Set DATABASE_URL in Railway environment variables');
