#!/usr/bin/env node

/**
 * Debug Authentication Issues
 * This script helps debug the 500 error in the login endpoint
 */

// Load environment variables first
require('dotenv').config({ path: '.env.local' });

const db = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('./config/environment');

async function testDatabaseConnection() {
  console.log('🗄️  Testing database connection...');
  
  try {
    const result = await db.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    return true;
  } catch (error) {
    console.log('❌ Database connection failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testUserTable() {
  console.log('\n👤 Testing user table...');
  
  try {
    const result = await db.query('SELECT COUNT(*) as user_count FROM users');
    console.log('✅ User table accessible');
    console.log(`   Total users: ${result.rows[0].user_count}`);
    
    // Check table structure
    const structure = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('   Table structure:');
    structure.rows.forEach(row => {
      console.log(`     - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    return true;
  } catch (error) {
    console.log('❌ User table access failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testBcrypt() {
  console.log('\n🔐 Testing bcrypt...');
  
  try {
    const password = 'testpassword123';
    const saltRounds = 12;
    
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('✅ Password hashing successful');
    console.log(`   Hash: ${hashedPassword.substring(0, 50)}...`);
    
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log(`✅ Password comparison: ${isValid ? 'PASS' : 'FAIL'}`);
    
    return true;
  } catch (error) {
    console.log('❌ Bcrypt test failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testJWTGeneration() {
  console.log('\n🎫 Testing JWT generation...');
  
  try {
    if (!config.JWT_SECRET) {
      console.log('❌ JWT_SECRET is not configured');
      return false;
    }
    
    if (config.JWT_SECRET.length < 32) {
      console.log(`❌ JWT_SECRET is too short (${config.JWT_SECRET.length} characters)`);
      return false;
    }
    
    const token = jwt.sign(
      { userId: 1, iat: Math.floor(Date.now() / 1000) },
      config.JWT_SECRET,
      {
        expiresIn: config.JWT_EXPIRES_IN,
        issuer: config.JWT_ISSUER,
        audience: config.JWT_AUDIENCE
      }
    );
    
    console.log('✅ JWT generation successful');
    console.log(`   Token: ${token.substring(0, 50)}...`);
    
    // Test verification
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE
    });
    
    console.log('✅ JWT verification successful');
    console.log(`   Decoded: ${JSON.stringify(decoded)}`);
    
    return true;
  } catch (error) {
    console.log('❌ JWT test failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testUserQuery() {
  console.log('\n🔍 Testing user query (simulating login)...');
  
  try {
    const testEmail = 'test@example.com';
    
    // This is the exact query from the auth route
    const user = await db.query(
      'SELECT id, email, username, full_name, password_hash, role, is_active, created_at FROM users WHERE email = $1 OR username = $1',
      [testEmail]
    );
    
    console.log('✅ User query executed successfully');
    console.log(`   Found ${user.rows.length} users`);
    
    if (user.rows.length > 0) {
      const userData = user.rows[0];
      console.log('   User data:');
      console.log(`     - ID: ${userData.id}`);
      console.log(`     - Email: ${userData.email}`);
      console.log(`     - Username: ${userData.username}`);
      console.log(`     - Role: ${userData.role}`);
      console.log(`     - Active: ${userData.is_active}`);
      console.log(`     - Has password: ${userData.password_hash ? 'Yes' : 'No'}`);
    } else {
      console.log('   No user found with that email/username');
    }
    
    return true;
  } catch (error) {
    console.log('❌ User query failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Authentication Debug Test');
  console.log('=' .repeat(50));
  
  const dbTest = await testDatabaseConnection();
  const userTableTest = await testUserTable();
  const bcryptTest = await testBcrypt();
  const jwtTest = await testJWTGeneration();
  const userQueryTest = await testUserQuery();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results:');
  console.log(`   Database Connection: ${dbTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   User Table Access: ${userTableTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Bcrypt: ${bcryptTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   JWT Generation: ${jwtTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   User Query: ${userQueryTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!dbTest || !userTableTest) {
    console.log('\n💡 Database issues detected - check Railway database connection');
  }
  
  if (!jwtTest) {
    console.log('\n💡 JWT issues detected - check JWT_SECRET configuration');
  }
  
  if (dbTest && userTableTest && bcryptTest && jwtTest && userQueryTest) {
    console.log('\n✅ All components working - the issue might be in the request handling');
  }
  
  // Close database connection
  if (db.end) {
    db.end();
  }
}

// Run tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testDatabaseConnection,
  testUserTable,
  testBcrypt,
  testJWTGeneration,
  testUserQuery
};
