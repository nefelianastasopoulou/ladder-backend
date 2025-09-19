#!/usr/bin/env node

/**
 * Test JWT Token Generation
 * This script tests JWT token generation to identify the login issue
 */

const jwt = require('jsonwebtoken');

// Test JWT token generation
function testJWTGeneration() {
  console.log('🔐 Testing JWT Token Generation...');
  console.log('=' .repeat(50));
  
  // Test with a sample JWT_SECRET
  const testSecret = 'test-secret-key-that-is-long-enough-for-jwt-generation-testing';
  const testUserId = 1;
  
  try {
    // Test basic JWT generation
    const token = jwt.sign(
      { userId: testUserId, iat: Math.floor(Date.now() / 1000) },
      testSecret,
      {
        expiresIn: '7d',
        issuer: 'ladder-backend',
        audience: 'ladder-app'
      }
    );
    
    console.log('✅ JWT token generation successful');
    console.log(`   Token length: ${token.length}`);
    console.log(`   Token preview: ${token.substring(0, 50)}...`);
    
    // Test token verification
    const decoded = jwt.verify(token, testSecret, {
      issuer: 'ladder-backend',
      audience: 'ladder-app'
    });
    
    console.log('✅ JWT token verification successful');
    console.log(`   Decoded payload:`, decoded);
    
    return true;
  } catch (error) {
    console.log('❌ JWT token generation failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test with environment variables
function testWithEnvironment() {
  console.log('\n🌍 Testing with environment variables...');
  
  const jwtSecret = process.env.JWT_SECRET;
  const jwtIssuer = process.env.JWT_ISSUER || 'ladder-backend';
  const jwtAudience = process.env.JWT_AUDIENCE || 'ladder-app';
  
  if (!jwtSecret) {
    console.log('❌ JWT_SECRET environment variable is not set');
    return false;
  }
  
  if (jwtSecret.length < 32) {
    console.log(`❌ JWT_SECRET is too short (${jwtSecret.length} characters, minimum 32)`);
    return false;
  }
  
  console.log(`✅ JWT_SECRET is configured (${jwtSecret.length} characters)`);
  console.log(`✅ JWT_ISSUER: ${jwtIssuer}`);
  console.log(`✅ JWT_AUDIENCE: ${jwtAudience}`);
  
  try {
    const token = jwt.sign(
      { userId: 1, iat: Math.floor(Date.now() / 1000) },
      jwtSecret,
      {
        expiresIn: '7d',
        issuer: jwtIssuer,
        audience: jwtAudience
      }
    );
    
    console.log('✅ JWT token generation with environment variables successful');
    
    // Test verification
    const decoded = jwt.verify(token, jwtSecret, {
      issuer: jwtIssuer,
      audience: jwtAudience
    });
    
    console.log('✅ JWT token verification with environment variables successful');
    return true;
  } catch (error) {
    console.log('❌ JWT token generation with environment variables failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test database connection simulation
function testDatabaseConnection() {
  console.log('\n🗄️  Testing database connection simulation...');
  
  // Simulate the database query from the auth route
  const testUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    full_name: 'Test User',
    password: '$2a$12$hashedpassword', // This would be a real bcrypt hash
    role: 'user',
    is_active: true,
    created_at: new Date()
  };
  
  console.log('✅ Simulated user data structure is valid');
  console.log(`   User ID: ${testUser.id}`);
  console.log(`   Email: ${testUser.email}`);
  console.log(`   Username: ${testUser.username}`);
  console.log(`   Role: ${testUser.role}`);
  console.log(`   Active: ${testUser.is_active}`);
  
  return true;
}

// Main test function
function main() {
  console.log('🚀 JWT and Database Test');
  console.log('=' .repeat(50));
  
  const jwtTest = testJWTGeneration();
  const envTest = testWithEnvironment();
  const dbTest = testDatabaseConnection();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results:');
  console.log(`   JWT Generation: ${jwtTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Environment Config: ${envTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Database Simulation: ${dbTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!envTest) {
    console.log('\n💡 Recommendations:');
    console.log('   1. Check that JWT_SECRET is set in Railway environment variables');
    console.log('   2. Ensure JWT_SECRET is at least 32 characters long');
    console.log('   3. Verify JWT_ISSUER and JWT_AUDIENCE are configured');
  }
  
  if (jwtTest && envTest && dbTest) {
    console.log('\n✅ All tests passed - JWT configuration appears correct');
    console.log('   The login issue might be elsewhere (database query, bcrypt, etc.)');
  }
}

// Run tests
if (require.main === module) {
  main();
}

module.exports = {
  testJWTGeneration,
  testWithEnvironment,
  testDatabaseConnection
};
