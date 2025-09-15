#!/usr/bin/env node

/**
 * Quick API Test - Tests basic endpoints without full setup
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

async function quickTest() {
  console.log('🚀 Running Quick API Tests...\n');

  const tests = [
    {
      name: 'Health Check',
      method: 'GET',
      endpoint: '/health',
      expectedStatus: 200
    },
    {
      name: 'Detailed Health Check',
      method: 'GET',
      endpoint: '/health/detailed',
      expectedStatus: 200
    },
    {
      name: 'Readiness Check',
      method: 'GET',
      endpoint: '/health/ready',
      expectedStatus: 200
    },
    {
      name: 'Liveness Check',
      method: 'GET',
      endpoint: '/health/live',
      expectedStatus: 200
    },
    {
      name: 'API Status',
      method: 'GET',
      endpoint: '/',
      expectedStatus: 200
    },
    {
      name: 'Get Opportunities (Public)',
      method: 'GET',
      endpoint: '/api/opportunities',
      expectedStatus: 200
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      
      const response = await fetch(`${BASE_URL}${test.endpoint}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.status === test.expectedStatus && data.success !== false) {
        console.log(`✅ PASSED: ${test.name} (${response.status})`);
        passed++;
      } else {
        console.log(`❌ FAILED: ${test.name} - Expected ${test.expectedStatus}, got ${response.status}`);
        console.log(`   Response:`, data);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${test.name} - ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Quick Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All quick tests passed! Server is responding correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check if the server is running.');
  }
}

// Run quick test
quickTest().catch(error => {
  console.error('Quick test failed:', error);
  process.exit(1);
});
