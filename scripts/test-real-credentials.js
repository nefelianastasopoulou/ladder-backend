#!/usr/bin/env node

/**
 * Test with real credentials
 * This script tests with the actual credentials from your database
 */

const https = require('https');

async function testWithRealCredentials() {
  console.log('🔐 Testing with real credentials from your database...');
  
  // Test with the actual user from your database
  const loginData = {
    email: 'nefelianastasopoulou12@gmail.com', // Real email from your database
    password: 'admin123' // Common default password
  };
  
  console.log('Testing with:', loginData.email);
  
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

async function testWithUsername() {
  console.log('\n🔐 Testing with username instead of email...');
  
  const loginData = {
    email: 'admin', // Using username as email field
    password: 'admin123'
  };
  
  console.log('Testing with username:', loginData.email);
  
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
  console.log('🚀 Testing with real credentials');
  console.log('=' .repeat(50));
  
  try {
    // Test with email
    const emailResponse = await testWithRealCredentials();
    console.log(`\n📧 Email test:`);
    console.log(`   Status: ${emailResponse.status}`);
    console.log(`   Response:`, emailResponse.data);
    
    // Test with username
    const usernameResponse = await testWithUsername();
    console.log(`\n👤 Username test:`);
    console.log(`   Status: ${usernameResponse.status}`);
    console.log(`   Response:`, usernameResponse.data);
    
    if (emailResponse.status === 500 || usernameResponse.status === 500) {
      console.log('\n❌ Still getting 500 errors!');
      console.log('This suggests there might be an issue with the authentication route.');
    } else if (emailResponse.status === 401 || usernameResponse.status === 401) {
      console.log('\n✅ Server is working, but credentials are wrong.');
      console.log('Try different passwords or create a new account.');
    } else if (emailResponse.status === 200 || usernameResponse.status === 200) {
      console.log('\n🎉 Login successful!');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

if (require.main === module) {
  main();
}
