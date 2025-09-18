// Test the actual backend validation using Joi schemas
const { validate, schemas } = require('../middleware/validation');

describe('Backend Validation (Joi Schemas)', () => {
  describe('User Registration Validation', () => {
    it('should validate correct user data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        full_name: 'Test User',
        username: 'testuser'
      };
      
      const result = validate(schemas.user.signup, validData);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'TestPassword123!',
        full_name: 'Test User',
        username: 'testuser'
      };
      
      const result = validate(schemas.user.signup, invalidData);
      expect(result.error).toBeDefined();
      expect(result.error.details[0].message).toContain('email');
    });

    it('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
        full_name: 'Test User',
        username: 'testuser'
      };
      
      const result = validate(schemas.user.signup, invalidData);
      expect(result.error).toBeDefined();
      expect(result.error.details[0].message).toContain('password');
    });

    it('should reject short username', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        full_name: 'Test User',
        username: 'ab'
      };
      
      const result = validate(schemas.user.signup, invalidData);
      expect(result.error).toBeDefined();
      expect(result.error.details[0].message).toContain('username');
    });
  });

  describe('User Login Validation', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };
      
      const result = validate(schemas.user.signin, validData);
      expect(result.error).toBeUndefined();
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'TestPassword123!'
      };
      
      const result = validate(schemas.user.signin, invalidData);
      expect(result.error).toBeDefined();
      expect(result.error.details[0].message).toContain('email');
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com'
      };
      
      const result = validate(schemas.user.signin, invalidData);
      expect(result.error).toBeDefined();
      expect(result.error.details[0].message).toContain('password');
    });
  });
});
