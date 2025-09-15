# API Testing Documentation

This directory contains comprehensive testing tools for the Ladder Backend API.

## Test Files

### `quick-test.js`
**Purpose**: Quick validation of basic endpoints  
**Usage**: `node tests/quick-test.js`  
**Tests**: Health checks, basic API status, public endpoints  
**Best for**: Quick verification that the server is running and responding

### `api-test-suite.js`
**Purpose**: Comprehensive testing of all API endpoints  
**Usage**: `npm run test-suite` or `node tests/api-test-suite.js`  
**Tests**: All endpoints with authentication, error handling, and edge cases  
**Best for**: Full regression testing and CI/CD pipelines

## Running Tests

### Quick Test (Recommended for Development)
```bash
# Test basic endpoints
node tests/quick-test.js

# Or use npm script
npm run test
```

### Full Test Suite
```bash
# Run comprehensive test suite
npm run test-suite

# Or directly
node tests/api-test-suite.js
```

## Test Configuration

### Environment Variables
- `TEST_BASE_URL`: Base URL for testing (default: `http://localhost:3001`)

### Prerequisites
1. **Server Running**: Ensure the backend server is running on the configured port
2. **Database**: PostgreSQL database must be accessible and migrated
3. **Dependencies**: All npm dependencies must be installed

## Test Coverage

### ✅ Tested Endpoints
- **Health & Status**: `/`, `/health`, `/health/detailed`, `/health/ready`, `/health/live`
- **Authentication**: `/api/auth/signup`, `/api/auth/signin`
- **User Management**: `/api/profile`, `/api/users`
- **Search**: `/api/search/users`, `/api/search/posts`, `/api/search/communities`, `/api/search/all`
- **Communities**: `/api/communities`, community CRUD operations
- **Opportunities**: `/api/opportunities`, `/api/opportunities/my`
- **Applications**: `/api/applications`
- **Favorites**: `/api/favorites`
- **Settings**: `/api/settings`
- **Onboarding**: `/api/onboarding`
- **Messaging**: `/api/conversations`
- **Reports**: `/api/reports`
- **Admin**: Admin-only endpoints

### 🔒 Security Testing
- **Authentication**: Valid/invalid credentials
- **Authorization**: Protected endpoint access
- **Rate Limiting**: Request throttling
- **Input Validation**: Malformed requests

### 📊 Test Results
Tests provide detailed reporting including:
- Pass/fail counts
- Success rate percentage
- Error details for failed tests
- Response validation

## Troubleshooting

### Common Issues

#### "fetch is not a function"
- **Cause**: Node.js version compatibility with node-fetch
- **Solution**: Tests use dynamic import for node-fetch v3 compatibility

#### "Cannot GET /endpoint"
- **Cause**: Server not running or endpoint not found
- **Solution**: Ensure server is running and check endpoint URLs

#### "Database error"
- **Cause**: Database connection issues
- **Solution**: Check DATABASE_URL and ensure PostgreSQL is running

#### "401 Unauthorized"
- **Cause**: Authentication token issues
- **Solution**: Tests create test users automatically, but check JWT_SECRET

### Debug Mode
For detailed debugging, check server logs and ensure `LOG_LEVEL=debug` in your `.env` file.

## Integration with CI/CD

The test suite is designed to work in CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Run API Tests
  run: |
    cd backend
    npm install
    npm run test-suite
```

## Contributing

When adding new endpoints:
1. Add tests to `api-test-suite.js`
2. Update this README with new endpoint coverage
3. Ensure tests cover both success and error cases
4. Test authentication and authorization requirements
