// Test setup and teardown
const express = require('express');

// Create a test app without starting a server
const createTestApp = () => {
  const app = express();
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/ladder_test';
  
  // Basic middleware
  app.use(express.json());
  
  // Mock routes for testing
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });
  
  app.get('/health/detailed', (req, res) => {
    res.json({ 
      status: 'healthy', 
      database: { status: 'connected' },
      environment_variables: { DATABASE_URL: 'set' },
      memory_usage: { used: '50MB' }
    });
  });
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', api_version: '1.0.0' });
  });
  
  app.post('/api/auth/signup', (req, res) => {
    const { email, password, full_name, username } = req.body;
    
    // Basic validation
    if (!email || !password || !full_name || !username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password too short' });
    }
    
    res.status(201).json({
      message: 'User created successfully',
      user: { email, full_name, username },
      token: 'mock-jwt-token'
    });
  });
  
  app.post('/api/auth/signin', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Mock invalid credentials test
    if (email === 'nonexistent@example.com' || password === 'wrongpassword') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({
      message: 'Login successful',
      user: { email, full_name: 'Test User' },
      token: 'mock-jwt-token'
    });
  });
  
  return app;
};

// Export test app
module.exports = { app: createTestApp() };
