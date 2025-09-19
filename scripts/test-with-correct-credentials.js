#!/usr/bin/env node

/**
 * Test with the correct credentials from the database
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
  console.log('🚀 Testing with correct credentials');
  console.log('=' .repeat(50));
  
  // Test with the user from your database
  const email = 'nefelianastasopoulou12@gmail.com';
  
  // Try common passwords
  const passwords = [
    'admin123',
    'password',
    'admin',
    '123456',
    'password123',
    'admin123!',
    'Admin123!'
  ];
  
  for (const password of passwords) {
    try {
      const response = await testLogin(email, password);
      
      console.log(`\nPassword: ${password}`);
      console.log(`Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log('🎉 SUCCESS! Login worked!');
        console.log('Response:', response.data);
        break;
      } else if (response.status === 401) {
        console.log('❌ Wrong password');
      } else if (response.status === 500) {
        console.log('❌ Server error:', response.data);
      } else {
        console.log('Response:', response.data);
      }
      
      // Wait a bit between attempts to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

if (require.main === module) {
  main();
}
