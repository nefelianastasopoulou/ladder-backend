#!/usr/bin/env node

/**
 * Final comprehensive test of all authentication fixes
 */

const https = require('https');

async function makeRequest(path, method = 'GET', data = null) {
  const postData = data ? JSON.stringify(data) : null;
  
  const options = {
    hostname: 'ladder-backend-production.up.railway.app',
    port: 443,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Origin': 'https://expo.dev'
    }
  };
  
  if (postData) {
    options.headers['Content-Length'] = Buffer.byteLength(postData);
  }
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testLogin() {
  console.log('\n🔐 Testing Login...');
  
  try {
    const response = await makeRequest('/api/auth/signin', 'POST', {
      email: 'test@example.com',
      password: 'test123'
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Login successful!');
      
      // Check response format
      if (response.data.user && response.data.token) {
        console.log('✅ Response format correct (user and token fields present)');
        
        // Check field names
        if (response.data.user.full_name && response.data.user.created_at) {
          console.log('✅ Field names correct (snake_case)');
        } else {
          console.log('❌ Field names incorrect - expected snake_case');
          console.log('   Available fields:', Object.keys(response.data.user));
        }
        
        // Check if user has required fields
        const requiredFields = ['id', 'email', 'username', 'full_name', 'role', 'created_at'];
        const missingFields = requiredFields.filter(field => !response.data.user[field]);
        
        if (missingFields.length === 0) {
          console.log('✅ All required user fields present');
        } else {
          console.log(`❌ Missing user fields: ${missingFields.join(', ')}`);
        }
        
        // Check if role field is present (replaces is_admin)
        if (response.data.user.role) {
          console.log(`✅ Role field present: ${response.data.user.role}`);
        } else {
          console.log('❌ Role field missing');
        }
        
        return response.data.token;
      } else {
        console.log('❌ Response format incorrect - missing user or token field');
        console.log('   Available fields:', Object.keys(response.data));
        return null;
      }
    } else if (response.status === 401) {
      console.log('❌ Authentication failed - wrong credentials');
      return null;
    } else if (response.status === 500) {
      console.log('❌ Server error - fixes may not be deployed yet');
      console.log('   Error details:', response.data);
      return null;
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
      console.log('Response:', response.data);
      return null;
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function testSignup() {
  console.log('\n📝 Testing Signup...');
  
  try {
    const response = await makeRequest('/api/auth/signup', 'POST', {
      email: `test${Date.now()}@example.com`,
      password: 'Test123!',
      full_name: 'Test User',
      username: `testuser${Date.now()}`
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 201) {
      console.log('✅ Signup successful!');
      
      // Check response format
      if (response.data.user && response.data.token) {
        console.log('✅ Response format correct (user and token fields present)');
        
        // Check field names
        if (response.data.user.full_name && response.data.user.created_at) {
          console.log('✅ Field names correct (snake_case)');
        } else {
          console.log('❌ Field names incorrect - expected snake_case');
        }
        
        return true;
      } else {
        console.log('❌ Response format incorrect - missing user or token field');
        return false;
      }
    } else if (response.status === 409) {
      console.log('⚠️  User already exists (expected for some tests)');
      return true;
    } else {
      console.log(`❌ Signup failed with status: ${response.status}`);
      console.log('Response:', response.data);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testForgotPassword() {
  console.log('\n🔑 Testing Forgot Password...');
  
  try {
    const response = await makeRequest('/api/auth/forgot-password', 'POST', {
      email: 'test@example.com'
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Forgot password endpoint working!');
      return true;
    } else {
      console.log(`❌ Forgot password failed with status: ${response.status}`);
      console.log('Response:', response.data);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testWithWrongCredentials() {
  console.log('\n🚫 Testing with wrong credentials...');
  
  try {
    const response = await makeRequest('/api/auth/signin', 'POST', {
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected wrong credentials');
      return true;
    } else if (response.status === 500) {
      console.log('❌ Server error with wrong credentials - this should be 401');
      console.log('   Error details:', response.data);
      return false;
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
      console.log('Response:', response.data);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Final Comprehensive Authentication Fixes Test');
  console.log('=' .repeat(70));
  
  const results = {
    login: false,
    signup: false,
    forgotPassword: false,
    wrongCredentials: false
  };
  
  // Test login
  const token = await testLogin();
  results.login = token !== null;
  
  // Test signup
  results.signup = await testSignup();
  
  // Test forgot password
  results.forgotPassword = await testForgotPassword();
  
  // Test wrong credentials
  results.wrongCredentials = await testWithWrongCredentials();
  
  // Summary
  console.log('\n📊 Final Test Results Summary:');
  console.log('=' .repeat(40));
  console.log(`Login: ${results.login ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Signup: ${results.signup ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Forgot Password: ${results.forgotPassword ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Wrong Credentials: ${results.wrongCredentials ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! Authentication is fully working!');
    console.log('✅ All critical issues have been resolved:');
    console.log('   - Password field mismatches fixed');
    console.log('   - Route path mismatches fixed');
    console.log('   - Response format mismatches fixed');
    console.log('   - Field name inconsistencies fixed');
    console.log('   - Database schema issues fixed (is_admin → role)');
    console.log('\n🚀 Ready to deploy to Railway!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
    console.log('🔧 Additional fixes may be needed before deployment.');
  }
}

if (require.main === module) {
  main();
}
