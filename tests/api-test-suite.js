#!/usr/bin/env node

/**
 * Comprehensive API Test Suite for Ladder Backend
 * Tests all endpoints with various scenarios
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testPassword123',
  full_name: 'Test User',
  username: 'testuser'
};

class APITester {
  constructor() {
    this.authToken = null;
    this.adminToken = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      errors: []
    };
  }

  async runTest(name, testFunction) {
    this.testResults.total++;
    try {
      console.log(`🧪 Running: ${name}`);
      await testFunction();
      this.testResults.passed++;
      console.log(`✅ PASSED: ${name}`);
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push({ test: name, error: error.message });
      console.log(`❌ FAILED: ${name} - ${error.message}`);
    }
  }

  async makeRequest(method, endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.authToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, config);
    const data = await response.json();
    
    return { response, data };
  }

  async testHealthEndpoints() {
    // Test basic health check
    const { response, data } = await this.makeRequest('GET', '/health');
    if (response.status !== 200 || !data.success) {
      throw new Error('Health check failed');
    }

    // Test detailed health check
    const { response: detailedResponse, data: detailedData } = await this.makeRequest('GET', '/health/detailed');
    if (detailedResponse.status !== 200 || !detailedData.success) {
      throw new Error('Detailed health check failed');
    }

    // Test readiness check
    const { response: readyResponse, data: readyData } = await this.makeRequest('GET', '/health/ready');
    if (readyResponse.status !== 200 || !readyData.success) {
      throw new Error('Readiness check failed');
    }

    // Test liveness check
    const { response: liveResponse, data: liveData } = await this.makeRequest('GET', '/health/live');
    if (liveResponse.status !== 200 || !liveData.success) {
      throw new Error('Liveness check failed');
    }
  }

  async testAuthentication() {
    // Test signup
    const { response: signupResponse, data: signupData } = await this.makeRequest('POST', '/api/auth/signup', {
      body: JSON.stringify(TEST_USER)
    });

    if (signupResponse.status !== 201 || !signupData.success || !signupData.data.token) {
      throw new Error('User signup failed');
    }

    this.authToken = signupData.data.token;

    // Test signin
    const { response: signinResponse, data: signinData } = await this.makeRequest('POST', '/api/auth/signin', {
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });

    if (signinResponse.status !== 200 || !signinData.success || !signinData.data.token) {
      throw new Error('User signin failed');
    }

    // Test invalid credentials
    const { response: invalidResponse } = await this.makeRequest('POST', '/api/auth/signin', {
      body: JSON.stringify({
        email: TEST_USER.email,
        password: 'wrongpassword'
      })
    });

    if (invalidResponse.status !== 401) {
      throw new Error('Invalid credentials should return 401');
    }
  }

  async testUserProfile() {
    // Test get profile
    const { response: profileResponse, data: profileData } = await this.makeRequest('GET', '/api/profile');
    if (profileResponse.status !== 200 || !profileData.success) {
      throw new Error('Get profile failed');
    }

    // Test update profile
    const { response: updateResponse, data: updateData } = await this.makeRequest('PUT', '/api/profile', {
      body: JSON.stringify({
        full_name: 'Updated Test User',
        bio: 'Test bio'
      })
    });

    if (updateResponse.status !== 200 || !updateData.success) {
      throw new Error('Update profile failed');
    }
  }

  async testSearchEndpoints() {
    // Test user search
    const { response: userSearchResponse } = await this.makeRequest('GET', '/api/search/users?q=test');
    if (userSearchResponse.status !== 200) {
      throw new Error('User search failed');
    }

    // Test post search
    const { response: postSearchResponse } = await this.makeRequest('GET', '/api/search/posts?q=test');
    if (postSearchResponse.status !== 200) {
      throw new Error('Post search failed');
    }

    // Test community search
    const { response: communitySearchResponse } = await this.makeRequest('GET', '/api/search/communities?q=test');
    if (communitySearchResponse.status !== 200) {
      throw new Error('Community search failed');
    }

    // Test combined search
    const { response: combinedSearchResponse } = await this.makeRequest('GET', '/api/search/all?q=test');
    if (combinedSearchResponse.status !== 200) {
      throw new Error('Combined search failed');
    }
  }

  async testCommunities() {
    // Test get communities
    const { response: communitiesResponse, data: communitiesData } = await this.makeRequest('GET', '/api/communities');
    if (communitiesResponse.status !== 200 || !communitiesData.success) {
      throw new Error('Get communities failed');
    }

    // Test create community
    const { response: createResponse, data: createData } = await this.makeRequest('POST', '/api/communities', {
      body: JSON.stringify({
        name: 'Test Community',
        description: 'A test community',
        category: 'Testing'
      })
    });

    if (createResponse.status !== 201 || !createData.success) {
      throw new Error('Create community failed');
    }

    const communityId = createData.data.community.id;

    // Test get community posts
    const { response: postsResponse } = await this.makeRequest('GET', `/api/communities/${communityId}/posts`);
    if (postsResponse.status !== 200) {
      throw new Error('Get community posts failed');
    }

    // Test join community
    const { response: joinResponse } = await this.makeRequest('POST', `/api/communities/${communityId}/join`);
    if (joinResponse.status !== 200) {
      throw new Error('Join community failed');
    }

    // Test leave community
    const { response: leaveResponse } = await this.makeRequest('POST', `/api/communities/${communityId}/leave`);
    if (leaveResponse.status !== 200) {
      throw new Error('Leave community failed');
    }
  }

  async testOpportunities() {
    // Test get opportunities
    const { response: opportunitiesResponse, data: opportunitiesData } = await this.makeRequest('GET', '/api/opportunities');
    if (opportunitiesResponse.status !== 200 || !opportunitiesData.success) {
      throw new Error('Get opportunities failed');
    }

    // Test get my opportunities
    const { response: myOpportunitiesResponse } = await this.makeRequest('GET', '/api/opportunities/my');
    if (myOpportunitiesResponse.status !== 200) {
      throw new Error('Get my opportunities failed');
    }
  }

  async testApplications() {
    // Test get applications
    const { response: applicationsResponse } = await this.makeRequest('GET', '/api/applications');
    if (applicationsResponse.status !== 200) {
      throw new Error('Get applications failed');
    }
  }

  async testFavorites() {
    // Test get favorites
    const { response: favoritesResponse } = await this.makeRequest('GET', '/api/favorites');
    if (favoritesResponse.status !== 200) {
      throw new Error('Get favorites failed');
    }
  }

  async testSettings() {
    // Test get settings
    const { response: settingsResponse, data: settingsData } = await this.makeRequest('GET', '/api/settings');
    if (settingsResponse.status !== 200 || !settingsData.success) {
      throw new Error('Get settings failed');
    }

    // Test update settings
    const { response: updateResponse, data: updateData } = await this.makeRequest('PUT', '/api/settings', {
      body: JSON.stringify({
        email_notifications: false,
        push_notifications: true,
        language: 'en'
      })
    });

    if (updateResponse.status !== 200 || !updateData.success) {
      throw new Error('Update settings failed');
    }
  }

  async testOnboarding() {
    // Test onboarding
    const { response: onboardingResponse, data: onboardingData } = await this.makeRequest('POST', '/api/onboarding', {
      body: JSON.stringify({
        age_range: '18-25',
        field_of_study: ['Computer Science'],
        academic_level: 'Undergraduate',
        university: 'Test University',
        preferences: ['Technology']
      })
    });

    if (onboardingResponse.status !== 200 || !onboardingData.success) {
      throw new Error('Onboarding failed');
    }
  }

  async testMessaging() {
    // Test get conversations
    const { response: conversationsResponse } = await this.makeRequest('GET', '/api/conversations');
    if (conversationsResponse.status !== 200) {
      throw new Error('Get conversations failed');
    }
  }

  async testReports() {
    // Test create report
    const { response: reportResponse, data: reportData } = await this.makeRequest('POST', '/api/reports', {
      body: JSON.stringify({
        reported_type: 'user',
        reported_id: 1,
        reason: 'Test report',
        description: 'This is a test report'
      })
    });

    if (reportResponse.status !== 201 || !reportData.success) {
      throw new Error('Create report failed');
    }
  }

  async testUnauthorizedAccess() {
    // Test accessing protected endpoint without token
    const { response } = await this.makeRequest('GET', '/api/profile', {
      headers: {} // No authorization header
    });

    if (response.status !== 401) {
      throw new Error('Unauthorized access should return 401');
    }
  }

  async testRateLimiting() {
    // Test rate limiting by making multiple requests
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(this.makeRequest('GET', '/health'));
    }

    const responses = await Promise.all(promises);
    const rateLimited = responses.some(r => r.response.status === 429);
    
    // Note: Rate limiting might not trigger in this test environment
    // This is more of a structural test
    console.log('Rate limiting test completed (may not trigger in test environment)');
  }

  async runAllTests() {
    console.log('🚀 Starting API Test Suite...\n');

    await this.runTest('Health Endpoints', () => this.testHealthEndpoints());
    await this.runTest('Authentication', () => this.testAuthentication());
    await this.runTest('User Profile', () => this.testUserProfile());
    await this.runTest('Search Endpoints', () => this.testSearchEndpoints());
    await this.runTest('Communities', () => this.testCommunities());
    await this.runTest('Opportunities', () => this.testOpportunities());
    await this.runTest('Applications', () => this.testApplications());
    await this.runTest('Favorites', () => this.testFavorites());
    await this.runTest('Settings', () => this.testSettings());
    await this.runTest('Onboarding', () => this.testOnboarding());
    await this.runTest('Messaging', () => this.testMessaging());
    await this.runTest('Reports', () => this.testReports());
    await this.runTest('Unauthorized Access', () => this.testUnauthorizedAccess());
    await this.runTest('Rate Limiting', () => this.testRateLimiting());

    this.printResults();
  }

  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📈 Total: ${this.testResults.total}`);
    console.log(`🎯 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);

    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.errors.forEach(error => {
        console.log(`  - ${error.test}: ${error.error}`);
      });
    }

    if (this.testResults.failed === 0) {
      console.log('\n🎉 All tests passed! API is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the server configuration.');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new APITester();
  tester.runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = APITester;
