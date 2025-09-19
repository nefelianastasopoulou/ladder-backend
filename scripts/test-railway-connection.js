#!/usr/bin/env node

/**
 * Test Railway Connection Script
 * This script helps debug connection issues with Railway deployment
 */

const https = require('https');
const http = require('http');

// Configuration
const RAILWAY_URL = 'https://ladder-backend-production.up.railway.app';
const TEST_ENDPOINTS = [
  '/',
  '/api/health',
  '/api/health/detailed'
];

// Test data for login
const TEST_LOGIN_DATA = {
  email: 'test@example.com',
  password: 'testpassword123'
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Railway-Connection-Test/1.0',
        ...options.headers
      },
      timeout: 10000
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test basic connectivity
async function testBasicConnectivity() {
  console.log('🔍 Testing basic connectivity...');
  
  for (const endpoint of TEST_ENDPOINTS) {
    try {
      const url = `${RAILWAY_URL}${endpoint}`;
      console.log(`   Testing: ${url}`);
      
      const response = await makeRequest(url);
      
      if (response.status === 200) {
        console.log(`   ✅ ${endpoint} - Status: ${response.status}`);
        if (response.data) {
          console.log(`      Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
        }
      } else {
        console.log(`   ⚠️  ${endpoint} - Status: ${response.status}`);
        if (response.rawData) {
          console.log(`      Response: ${response.rawData.substring(0, 200)}...`);
        }
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint} - Error: ${error.message}`);
    }
  }
}

// Test CORS headers
async function testCORS() {
  console.log('\n🌐 Testing CORS configuration...');
  
  const testOrigins = [
    'https://expo.dev',
    'https://localhost:8081',
    'https://127.0.0.1:8081',
    'http://localhost:8081',
    'https://ladder-backend-production.up.railway.app'
  ];

  for (const origin of testOrigins) {
    try {
      const response = await makeRequest(`${RAILWAY_URL}/api/health`, {
        headers: {
          'Origin': origin
        }
      });
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
        'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': response.headers['access-control-allow-headers'],
        'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials']
      };
      
      console.log(`   Origin: ${origin}`);
      console.log(`   CORS Headers:`, corsHeaders);
      
      if (response.status === 200) {
        console.log(`   ✅ CORS OK`);
      } else {
        console.log(`   ⚠️  Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

// Test login endpoint
async function testLogin() {
  console.log('\n🔐 Testing login endpoint...');
  
  try {
    const response = await makeRequest(`${RAILWAY_URL}/api/auth/signin`, {
      method: 'POST',
      body: TEST_LOGIN_DATA
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Headers:`, response.headers);
    
    if (response.data) {
      console.log(`   Response:`, response.data);
    } else if (response.rawData) {
      console.log(`   Raw Response:`, response.rawData.substring(0, 500));
    }
    
    if (response.status === 500) {
      console.log('   ❌ Server error detected - check Railway logs');
    } else if (response.status === 401) {
      console.log('   ✅ Login endpoint working (expected 401 for invalid credentials)');
    } else if (response.status === 200) {
      console.log('   ✅ Login successful');
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Test database connection (via health endpoint)
async function testDatabase() {
  console.log('\n🗄️  Testing database connection...');
  
  try {
    const response = await makeRequest(`${RAILWAY_URL}/api/health/detailed`);
    
    if (response.data && response.data.database) {
      console.log(`   Database Status: ${response.data.database.status}`);
      if (response.data.database.error) {
        console.log(`   Database Error: ${response.data.database.error}`);
      }
    } else {
      console.log(`   Response:`, response.rawData);
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Railway Connection Test');
  console.log(`📍 Testing: ${RAILWAY_URL}`);
  console.log('=' .repeat(50));
  
  await testBasicConnectivity();
  await testCORS();
  await testDatabase();
  await testLogin();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Test completed');
  console.log('\n💡 If you see 500 errors:');
  console.log('   1. Check Railway deployment logs');
  console.log('   2. Verify environment variables are set');
  console.log('   3. Check database connection');
  console.log('   4. Verify JWT_SECRET is configured');
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testBasicConnectivity,
  testCORS,
  testLogin,
  testDatabase,
  runTests
};
