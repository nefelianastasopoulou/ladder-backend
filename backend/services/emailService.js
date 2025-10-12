const nodemailer = require('nodemailer');

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail', // You can change this to other services like 'outlook', 'yahoo', etc.
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS  // Your email password or app password
    }
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    console.log('📧 Attempting to send password reset email...');
    console.log('Email configuration:', {
      user: process.env.EMAIL_USER ? '✓ Set' : '✗ Missing',
      pass: process.env.EMAIL_PASS ? '✓ Set' : '✗ Missing',
      frontendUrl: process.env.FRONTEND_URL || 'Not set'
    });

    const transporter = createTransporter();
    
    const resetLink = `${process.env.FRONTEND_URL || 'ladder://'}reset-password?token=${resetToken}`;
    
    console.log('Reset link:', resetLink);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset - Ladder App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Password Reset Request</h2>
          <p>You requested a password reset for your Ladder account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link:</p>
          <p style="word-break: break-all; color: #666;">${resetLink}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">This email was sent from Ladder App. Please do not reply to this email.</p>
        </div>
      `
    };

    console.log('Sending email to:', email);
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail
};
