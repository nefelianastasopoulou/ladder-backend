#!/usr/bin/env node

/**
 * Test Exact Login Request
 * This script tests the exact same request that your app is making
 */

const https = require('https');

// Test the exact same request your app makes
async function testExactLogin() {
  console.log('🔐 Testing exact login request from your app...');
  
  const loginData = {
    email: 'test@example.com', // This is what your app sends
    password: 'testpassword123'
  };
  
  const postData = JSON.stringify(loginData);
  
  const options = {
    hostname: 'ladder-backend-production.up.railway.app',
    port: 443,
    path: '/api/auth/signin',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Origin': 'https://expo.dev' // This might be the issue
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Test with different origins
async function testWithDifferentOrigins() {
  const origins = [
    'https://expo.dev',
    'https://localhost:8081',
    'http://localhost:8081',
    undefined // No origin
  ];
  
  for (const origin of origins) {
    console.log(`\n🌐 Testing with origin: ${origin || 'none'}`);
    
    try {
      const loginData = {
        email: 'test@example.com',
        password: 'testpassword123'
      };
      
      const postData = JSON.stringify(loginData);
      
      const options = {
        hostname: 'ladder-backend-production.up.railway.app',
        port: 443,
        path: '/api/auth/signin',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      };
      
      if (origin) {
        options.headers['Origin'] = origin;
      }
      
      const response = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const jsonData = JSON.parse(data);
              resolve({
                status: res.statusCode,
                headers: res.headers,
                data: jsonData
              });
            } catch (error) {
              resolve({
                status: res.statusCode,
                headers: res.headers,
                data: data,
                parseError: error.message
              });
            }
          });
        });
        
        req.on('error', (error) => {
          reject(error);
        });
        
        req.write(postData);
        req.end();
      });
      
      console.log(`   Status: ${response.status}`);
      console.log(`   CORS Origin: ${response.headers['access-control-allow-origin'] || 'none'}`);
      
      if (response.status === 500) {
        console.log(`   ❌ 500 Error:`, response.data);
      } else if (response.status === 401) {
        console.log(`   ✅ 401 (expected):`, response.data.message);
      } else {
        console.log(`   Response:`, response.data);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

// Main test
async function main() {
  console.log('🚀 Exact Login Request Test');
  console.log('=' .repeat(50));
  
  try {
    const response = await testExactLogin();
    
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, response.headers);
    console.log(`Response:`, response.data);
    
    if (response.status === 500) {
      console.log('\n❌ Still getting 500 error!');
      console.log('Let me test with different origins...');
      await testWithDifferentOrigins();
    } else {
      console.log('\n✅ Login endpoint is working!');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

// Run test
if (require.main === module) {
  main();
}

module.exports = { testExactLogin, testWithDifferentOrigins };
