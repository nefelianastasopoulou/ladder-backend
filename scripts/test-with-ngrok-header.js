#!/usr/bin/env node

/**
 * Test with ngrok header
 * This script tests with the exact headers your app sends
 */

const https = require('https');

async function testWithNgrokHeader() {
  console.log('🔐 Testing with ngrok header (exact app headers)...');
  
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
      'ngrok-skip-browser-warning': 'true', // This is what your app sends
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Origin': 'https://expo.dev'
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

async function main() {
  console.log('🚀 Testing with exact app headers');
  console.log('=' .repeat(50));
  
  try {
    const response = await testWithNgrokHeader();
    
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, response.headers);
    console.log(`Response:`, response.data);
    
    if (response.status === 500) {
      console.log('\n❌ 500 error with ngrok header!');
    } else {
      console.log('\n✅ Working with ngrok header!');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

if (require.main === module) {
  main();
}
