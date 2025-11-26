const nodemailer = require('nodemailer');
// Node.js 20 has built-in fetch - no need to import

// Check if email is configured
// For SendGrid, EMAIL_USER is "apikey" and EMAIL_PASS is the API key
// EMAIL_FROM is the actual sender email address
const isEmailConfigured = () => {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
};

// Detect email provider and get SMTP settings
const getSMTPConfig = () => {
  const emailUser = process.env.EMAIL_USER || '';
  const emailDomain = emailUser.split('@')[1]?.toLowerCase() || '';
  
  // Allow custom SMTP configuration via environment variables (PRIORITY)
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    console.log('Using custom SMTP configuration:', {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10)
    });
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT, 10) === 465,
    };
  }
  
  // Auto-detect based on email domain
  if (emailDomain === 'gmail.com' || emailDomain.endsWith('.gmail.com')) {
    // Gmail SMTP
    return {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
    };
  } else if (emailDomain.includes('outlook') || emailDomain.includes('hotmail') || emailDomain.includes('live') || emailDomain.includes('msn')) {
    // Microsoft Outlook/Hotmail
    return {
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
    };
  } else if (emailDomain.includes('yahoo')) {
    // Yahoo
    return {
      host: 'smtp.mail.yahoo.com',
      port: 587,
      secure: false,
    };
  } else if (emailDomain.includes('office365') || emailDomain.includes('microsoft')) {
    // Microsoft 365
    return {
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
    };
  } else {
    // For custom domains, we can't auto-detect
    // Default to Gmail SMTP ONLY if it's likely Google Workspace
    // Otherwise, user MUST set SMTP_HOST and SMTP_PORT
    console.warn('⚠️ Custom domain detected without SMTP configuration. Attempting Gmail SMTP (for Google Workspace).');
    console.warn('⚠️ If this fails, you MUST set SMTP_HOST and SMTP_PORT environment variables.');
    console.warn('⚠️ For non-Google Workspace emails, set:');
    console.warn('   SMTP_HOST=your-smtp-server.com');
    console.warn('   SMTP_PORT=587 (or 465 for SSL)');
    console.warn('   SMTP_SECURE=false (or true for port 465)');
    
    return {
      host: 'smtp.gmail.com', // Only works if it's Google Workspace
      port: 587,
      secure: false,
    };
  }
};

// Get email transporter - only create if credentials are available
const getTransporter = () => {
  if (!isEmailConfigured()) {
    throw new Error('Email service not configured: EMAIL_USER and EMAIL_PASS environment variables are required');
  }

  // Debug: Log all SMTP-related environment variables
  console.log('🔍 SMTP Environment Variables Check:', {
    SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
    SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
    SMTP_SECURE: process.env.SMTP_SECURE || 'NOT SET',
    EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
    EMAIL_PASS: process.env.EMAIL_PASS ? 'SET' : 'NOT SET'
  });

  const smtpConfig = getSMTPConfig();
  const emailUser = process.env.EMAIL_USER || '';
  
  console.log('Email configuration detected:', {
    domain: emailUser.split('@')[1],
    smtpHost: smtpConfig.host,
    smtpPort: smtpConfig.port,
    secure: smtpConfig.secure,
    usingCustomSMTP: !!(process.env.SMTP_HOST && process.env.SMTP_PORT)
  });

  const transporterConfig = {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Add connection timeout (increased for Railway)
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000,
    socketTimeout: 30000,
    // Retry configuration
    pool: true,
    maxConnections: 1,
    maxMessages: 3,
    // Additional options for better reliability
    tls: {
      // Do not fail on invalid certs (some providers have self-signed certs)
      rejectUnauthorized: false,
      // Use specific TLS version
      minVersion: 'TLSv1.2'
    }
  };

  console.log('📧 Creating email transporter with config:', {
    host: transporterConfig.host,
    port: transporterConfig.port,
    secure: transporterConfig.secure,
    authUser: transporterConfig.auth.user,
    connectionTimeout: transporterConfig.connectionTimeout
  });

  return nodemailer.createTransport(transporterConfig);
};

// Send email via SendGrid API (when EMAIL_USER is "apikey")
const sendViaSendGridAPI = async (to, from, subject, html) => {
  const apiKey = process.env.EMAIL_PASS;
  
  if (!apiKey) {
    throw new Error('EMAIL_PASS (SendGrid API key) is required');
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: to }]
      }],
      from: { email: from },
      subject: subject,
      content: [{
        type: 'text/html',
        value: html
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return { success: true };
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

    // Use EMAIL_FROM if set, otherwise fall back to EMAIL_USER
    // For SendGrid, EMAIL_USER is "apikey" so we need EMAIL_FROM
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    
    if (!fromEmail || fromEmail === 'apikey') {
      throw new Error('EMAIL_FROM environment variable must be set. For SendGrid, set EMAIL_FROM to your sender email (e.g., contact@ladderyouth.com)');
    }

    console.log('Email configuration:', {
      user: process.env.EMAIL_USER ? '✓ Set' : '✗ Missing',
      pass: process.env.EMAIL_PASS ? '✓ Set' : '✗ Missing',
      from: fromEmail,
      frontendUrl: process.env.FRONTEND_URL || 'Not set',
      usingSendGridAPI: process.env.EMAIL_USER === 'apikey'
    });
    
    const resetLink = `${process.env.FRONTEND_URL || 'ladder://'}reset-password?token=${resetToken}`;
    
    console.log('Reset link:', resetLink);

    // For mobile apps, show the token prominently since custom URL schemes don't work in email
    const isMobileAppLink = resetLink.startsWith('ladder://');
    
    const htmlContent = isMobileAppLink ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Password Reset Request</h2>
        <p>You requested a password reset for your Ladder account.</p>
        <p><strong>Please copy the reset token below and enter it in the Ladder app:</strong></p>
        <div style="background-color: #f3f4f6; border: 2px solid #4f46e5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Reset Token</p>
          <p style="margin: 10px 0 0 0; font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #1f2937; word-break: break-all;">${resetToken}</p>
        </div>
        <p style="color: #666; font-size: 14px;">1. Open the Ladder app</p>
        <p style="color: #666; font-size: 14px;">2. Go to "Reset Password" or "Enter Reset Token"</p>
        <p style="color: #666; font-size: 14px;">3. Paste the token above</p>
        <p style="color: #666; font-size: 14px;">4. Set your new password</p>
        <p><strong style="color: #dc2626;">This token will expire in 1 hour.</strong></p>
        <p style="color: #666; font-size: 12px;">If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">This email was sent from Ladder App. Please do not reply to this email.</p>
      </div>
    ` : `
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
    `;

    console.log('Sending email to:', email);
    console.log('From email:', fromEmail);
    
    // Use SendGrid API if EMAIL_USER is "apikey" (avoids SMTP port blocking)
    if (process.env.EMAIL_USER === 'apikey') {
      console.log('📧 Using SendGrid API (HTTPS) instead of SMTP to avoid port blocking...');
      const result = await sendViaSendGridAPI(email, fromEmail, 'Password Reset - Ladder App', htmlContent);
      console.log('✅ Password reset email sent successfully via SendGrid API');
      return result;
    }
    
    // Otherwise, use SMTP for other providers
    console.log('📧 Using SMTP transport...');
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
      
      // If it's a connection timeout, the SMTP server is likely wrong
      if (verifyError.code === 'ETIMEDOUT' || verifyError.message.includes('timeout')) {
        const emailDomain = process.env.EMAIL_USER?.split('@')[1] || 'unknown';
        console.error('❌ CONNECTION TIMEOUT - This usually means:');
        console.error('   1. Wrong SMTP server (custom domain may not be Google Workspace)');
        console.error('   2. SMTP server is blocking the connection');
        console.error('   3. Network/firewall issue');
        console.error('');
        console.error('💡 SOLUTION: Set custom SMTP settings in Railway:');
        console.error(`   SMTP_HOST=your-email-provider-smtp-server.com`);
        console.error(`   SMTP_PORT=587 (or 465 for SSL)`);
        console.error(`   SMTP_SECURE=false (or true for port 465)`);
        console.error('');
        console.error(`   For ${emailDomain}, check your email provider's SMTP settings:`);
        console.error('   - Google Workspace: smtp.gmail.com:587');
        console.error('   - Microsoft 365: smtp.office365.com:587');
        console.error('   - Zoho: smtp.zoho.com:587');
        console.error('   - SendGrid: Use EMAIL_USER=apikey to use API instead of SMTP');
        console.error('   - Mailgun: smtp.mailgun.org:587');
        throw new Error(`SMTP connection timeout. Please configure SMTP_HOST and SMTP_PORT for ${emailDomain}. See logs for details.`);
      }
      
      // Don't throw here - continue with sending attempt
      // Some email providers might still work even if verify fails
      console.warn('⚠️ Continuing with email send despite verification failure');
    }
    
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: 'Password Reset - Ladder App',
      html: htmlContent
    };
    
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
      response: error.response,
      responseCode: error.responseCode,
      responseMessage: error.responseMessage,
      stack: error.stack
    });
    
    // Provide helpful error messages for common issues
    if (error.code === 'ETIMEDOUT') {
      const emailDomain = process.env.EMAIL_USER?.split('@')[1] || 'unknown';
      const errorMsg = `SMTP connection timeout for ${emailDomain}. ` +
        `This usually means the SMTP server is incorrect. ` +
        `Please set SMTP_HOST and SMTP_PORT environment variables in Railway.`;
      console.error('💡 ' + errorMsg);
      throw new Error(errorMsg);
    } else if (error.code === 'EAUTH') {
      const errorMsg = 'Email authentication failed. ' +
        'For Gmail, make sure you\'re using an App Password, not your regular password.';
      console.error('💡 ' + errorMsg);
      throw new Error(errorMsg);
    }
    
    // Log full error object for debugging
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
  isEmailConfigured
};
