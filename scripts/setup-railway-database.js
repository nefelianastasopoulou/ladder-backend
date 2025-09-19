#!/usr/bin/env node

/**
 * Setup Railway Database Connection
 * This script helps you configure your local environment to use Railway database
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Railway Database Setup');
console.log('=' .repeat(50));

console.log('📋 To get your Railway DATABASE_URL:');
console.log('   1. Go to your Railway dashboard');
console.log('   2. Click on your project');
console.log('   3. Click on your PostgreSQL database service');
console.log('   4. Go to the "Connect" tab');
console.log('   5. Copy the "Connection String"');
console.log('   6. It should look like: postgresql://postgres:password@host:port/railway');
console.log('');

console.log('💡 Once you have your DATABASE_URL:');
console.log('   1. Open backend/.env.local');
console.log('   2. Replace the DATABASE_URL line with your actual Railway connection string');
console.log('   3. Save the file');
console.log('   4. Run: cd backend && node test-auth-debug.js');
console.log('');

console.log('🔧 Example DATABASE_URL format:');
console.log('   DATABASE_URL=postgresql://postgres:abc123@containers-us-west-123.railway.app:5432/railway');
console.log('');

console.log('⚠️  Important Notes:');
console.log('   - Keep your Railway DATABASE_URL secure');
console.log('   - Don\'t commit it to version control');
console.log('   - The .env.local file is already in .gitignore');
console.log('');

console.log('✅ After setting up the DATABASE_URL, your login should work!');
console.log('   The 500 error was caused by the missing database connection.');
