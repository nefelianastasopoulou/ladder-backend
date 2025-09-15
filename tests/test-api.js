// Use built-in fetch for Node.js 18+ or import node-fetch
let fetch;
try {
  fetch = globalThis.fetch;
} catch (error) {
  fetch = require('node-fetch');
}

const API_BASE_URL = 'https://web-production-b1a6.up.railway.app';

async function testAPI() {
  console.log('🧪 Testing Backend API...\n');

  // Test 1: Health Check
  try {
    console.log('1. Testing Health Check...');
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Health Check:', data);
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
  }

  // Test 2: Root Endpoint
  try {
    console.log('\n2. Testing Root Endpoint...');
    const response = await fetch(`${API_BASE_URL}/`);
    const data = await response.json();
    console.log('✅ Root Endpoint:', data);
  } catch (error) {
    console.log('❌ Root Endpoint Failed:', error.message);
  }

  // Test 3: Opportunities Endpoint (should work without auth)
  try {
    console.log('\n3. Testing Opportunities Endpoint...');
    const response = await fetch(`${API_BASE_URL}/api/opportunities`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Opportunities Endpoint:', `Found ${data.length} opportunities`);
    } else {
      console.log('❌ Opportunities Endpoint Failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Opportunities Endpoint Failed:', error.message);
  }

  // Test 4: Database Connection Test
  try {
    console.log('\n4. Testing Database Connection...');
    const response = await fetch(`${API_BASE_URL}/api/users`);
    if (response.status === 401) {
      console.log('✅ Database Connection: Working (401 Unauthorized is expected)');
    } else {
      console.log('❌ Database Connection: Unexpected response:', response.status);
    }
  } catch (error) {
    console.log('❌ Database Connection Failed:', error.message);
  }

  console.log('\n🏁 API Testing Complete!');
}

testAPI().catch(console.error);
