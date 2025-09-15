require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing email configuration...');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set (first 4 chars: ' + process.env.EMAIL_PASS.substring(0, 4) + '...)' : 'Not set');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log('❌ Email configuration is missing!');
  console.log('Please check your .env file has:');
  console.log('EMAIL_USER=your-email@gmail.com');
  console.log('EMAIL_PASS=your-app-password');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test the connection
transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Email configuration error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure 2-Step Verification is enabled on your Gmail');
    console.log('2. Generate an App Password: https://myaccount.google.com/apppasswords');
    console.log('3. Use the 16-character app password (not your regular password)');
  } else {
    console.log('✅ Email configuration is working!');
    console.log('Server is ready to send emails.');
  }
});

