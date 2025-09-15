const jwt = require('jsonwebtoken');

// Test token generation
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-development-only';

const testToken = jwt.sign(
  { id: 1, email: 'test@example.com', type: 'password_reset' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const resetLink = `ladder://reset-password?token=${testToken}`;

console.log('Test Reset Link:');
console.log(resetLink);
console.log('\nTo test:');
console.log('1. Copy this link');
console.log('2. Open your phone\'s browser or notes app');
console.log('3. Paste and tap the link');
console.log('4. It should open your app and navigate to reset-password screen');

