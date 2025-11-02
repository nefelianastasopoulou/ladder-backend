const nodemailer = require('nodemailer');

// Check if email is configured
const isEmailConfigured = () => {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
};

// Get email transporter - only create if credentials are available
const getTransporter = () => {
  if (!isEmailConfigured()) {
    throw new Error('Email service not configured: EMAIL_USER and EMAIL_PASS environment variables are required');
  }

  // Use explicit SMTP configuration for Gmail (more reliable than 'service: gmail')
  // Gmail SMTP settings
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Must be an App Password, not regular password
    },
    // Add connection timeout
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    // Retry configuration
    pool: true,
    maxConnections: 1,
    maxMessages: 3
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    console.log('📧 Attempting to send password reset email...');
    
    // Check configuration first
    if (!isEmailConfigured()) {
      const error = new Error('Email service not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
      console.error('❌ Email configuration missing:', {
        EMAIL_USER: process.env.EMAIL_USER ? '✓ Set' : '✗ Missing',
        EMAIL_PASS: process.env.EMAIL_PASS ? '✓ Set' : '✗ Missing'
      });
      throw error;
    }

    console.log('Email configuration:', {
      user: process.env.EMAIL_USER ? '✓ Set' : '✗ Missing',
      pass: process.env.EMAIL_PASS ? '✓ Set' : '✗ Missing',
      frontendUrl: process.env.FRONTEND_URL || 'Not set'
    });
    
    const resetLink = `${process.env.FRONTEND_URL || 'ladder://'}reset-password?token=${resetToken}`;
    
    console.log('Reset link:', resetLink);
    
    // Get transporter
    const transporter = getTransporter();
    
    // Verify transporter connection (with timeout) - but don't block if it fails
    try {
      const verifyPromise = transporter.verify();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Email verification timeout')), 5000);
      });
      
      await Promise.race([verifyPromise, timeoutPromise]);
      console.log('✅ Email transporter verified successfully');
    } catch (verifyError) {
      console.error('❌ Email transporter verification failed:', {
        message: verifyError.message,
        code: verifyError.code,
        command: verifyError.command,
        response: verifyError.response
      });
      // Don't throw here - continue with sending attempt
      // Some email providers might still work even if verify fails
      console.warn('⚠️ Continuing with email send despite verification failure');
    }
    
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
    console.log('From email:', process.env.EMAIL_USER);
    
    // Send email with explicit timeout
    const sendPromise = transporter.sendMail(mailOptions);
    const sendTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email send timeout after 15 seconds')), 15000);
    });
    
    const result = await Promise.race([sendPromise, sendTimeoutPromise]);
    
    console.log('✅ Password reset email sent successfully:', result.messageId);
    console.log('Email response:', result.response);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
  isEmailConfigured
};
