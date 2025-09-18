const request = require('supertest');
const { app } = require('./setup');

describe('Auth Routes', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        full_name: 'Test User',
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should reject signup with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPassword123!',
        full_name: 'Test User',
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject signup with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        full_name: 'Test User',
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/signin', () => {
    it('should sign in with valid credentials', async () => {
      // First create a user
      const userData = {
        email: 'signin@example.com',
        password: 'TestPassword123!',
        full_name: 'Sign In User',
        username: 'signinuser'
      };

      await request(app)
        .post('/api/auth/signup')
        .send(userData);

      // Then sign in
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
    });

    it('should reject signin with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
