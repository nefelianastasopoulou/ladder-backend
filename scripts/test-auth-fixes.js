#!/usr/bin/env node

/**
 * Test authentication fixes
 */

const https = require('https');

async function testLogin(email, password) {
  console.log(`🔐 Testing login with: ${email}`);
  
  const loginData = { email, password };
  const postData = JSON.stringify(loginData);
  
  const options = {
    hostname: 'ladder-backend-production.up.railway.app',
    port: 443,
    path: '/api/auth/signin',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'ngrok-skip-browser-warning': 'true',
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
  console.log('🚀 Testing Authentication Fixes');
  console.log('=' .repeat(50));
  
  // Test with the test user we created
  try {
    const response = await testLogin('test@example.com', 'test123');
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, response.data);
    
    if (response.status === 200) {
      console.log('\n🎉 SUCCESS! Login is working!');
      console.log('✅ The authentication fixes are working correctly');
    } else if (response.status === 401) {
      console.log('\n❌ Still getting authentication error - credentials might be wrong');
    } else if (response.status === 500) {
      console.log('\n❌ Still getting server error - fixes may not be deployed yet');
    } else {
      console.log(`\n⚠️  Unexpected status: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

if (require.main === module) {
  main();
}
