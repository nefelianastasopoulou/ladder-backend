require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

console.log('Email configuration:');
console.log('User:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('Pass:', process.env.EMAIL_PASS ? 'Set' : 'Not set');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  } else {
    console.log('Database connected successfully');
  }
});

// Initialize database tables using safe migration
console.log('Starting database migration...');

const DatabaseMigrator = require('./database-migrator');

const initializeDatabase = async () => {
  try {
    const migrator = new DatabaseMigrator();
    await migrator.migrate();
    console.log('✅ Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Run the safe database migration
initializeDatabase();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to require admin access
const requireAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Routes
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  db.all(
    'SELECT id, email, full_name, is_admin, created_at FROM users ORDER BY created_at DESC',
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(users || []);
    }
  );
});

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, full_name, username } = req.body;
          console.log('Profiles table created successfully');
          resolve();
        }
      });
    });

    console.log('Creating opportunities table...');
    await new Promise((resolve, reject) => {
      db.run(`CREATE TABLE IF NOT EXISTS opportunities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        location TEXT,
        field TEXT,
        image_url TEXT,
        deadline TEXT,
        requirements TEXT,
        contact_info TEXT,
        application_url TEXT,
        is_external_application BOOLEAN DEFAULT 0,
        posted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )`, (err) => {
        if (err) {
          console.error('Error creating opportunities table:', err);
          reject(err);
        } else {
          console.log('Opportunities table created successfully');
          resolve();
        }
      });
    });

    console.log('Creating favorites table...');
    await new Promise((resolve, reject) => {
      db.run(`CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        opportunity_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (opportunity_id) REFERENCES opportunities (id),
        UNIQUE(user_id, opportunity_id)
      )`, (err) => {
        if (err) {
          console.error('Error creating favorites table:', err);
          reject(err);
        } else {
          console.log('Favorites table created successfully');
          resolve();
        }
      });
    });

    console.log('Creating applications table...');
    await new Promise((resolve, reject) => {
      db.run(`CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        opportunity_id INTEGER,
        status TEXT DEFAULT 'applied',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (opportunity_id) REFERENCES opportunities (id),
        UNIQUE(user_id, opportunity_id)
      )`, (err) => {
        if (err) {
          console.error('Error creating applications table:', err);
          reject(err);
        } else {
          console.log('Applications table created successfully');
          resolve();
        }
      });
    });

    console.log('Creating email_changes table...');
    await new Promise((resolve, reject) => {
      db.run(`CREATE TABLE IF NOT EXISTS email_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        new_email TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`, (err) => {
        if (err) {
          console.error('Error creating email_changes table:', err);
          reject(err);
        } else {
          console.log('Email_changes table created successfully');
          resolve();
        }
      });
    });

    console.log('Creating user_settings table...');
    await new Promise((resolve, reject) => {
      db.run(`CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        posts_on_profile_visibility TEXT DEFAULT 'everyone',
        show_online_status BOOLEAN DEFAULT 1,
        push_notifications BOOLEAN DEFAULT 1,
        email_notifications BOOLEAN DEFAULT 1,
        language TEXT DEFAULT 'en',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`, (err) => {
        if (err) {
          console.error('Error creating user_settings table:', err);
          reject(err);
        } else {
          console.log('User_settings table created successfully');
          resolve();
        }
      });
    });

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

// Run the safe database migration
initializeDatabase();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Routes

// Sign up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, full_name, username } = req.body;

    if (!email || !password || !full_name || !username) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate username format (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    // Check username length
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }

    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (row) {
        return res.status(400).json({ error: 'Email or username already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      db.run(
        'INSERT INTO users (email, password, full_name, username, is_admin) VALUES (?, ?, ?, ?, ?)',
        [email, hashedPassword, full_name, username, false], // Default to non-admin
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Error creating user' });
          }

          const userId = this.lastID;

          // Create profile
          db.run(
            'INSERT INTO profiles (user_id) VALUES (?)',
            [userId],
            function(err) {
              if (err) {
                console.error('Error creating profile:', err);
              }

              // Generate JWT token
              const token = jwt.sign(
                { id: userId, email, full_name, username, is_admin: false },
                JWT_SECRET,
                { expiresIn: '7d' }
              );

              res.json({
                user: { id: userId, email, full_name, username, is_admin: false },
                token
              });
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Make user admin (admin only)
app.post('/api/auth/make-admin', authenticateToken, requireAdmin, (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  db.run(
    'UPDATE users SET is_admin = 1 WHERE id = ?',
    [user_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User promoted to admin successfully' });
    }
  );
});

// Delete user (admin only)
app.delete('/api/users/:userId', authenticateToken, requireAdmin, (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  // Prevent admin from deleting themselves
  if (parseInt(userId) === currentUserId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  db.run(
    'DELETE FROM users WHERE id = ?',
    [userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    }
  );
});

// Make first user admin (no auth required - for initial setup)
app.post('/api/auth/setup-first-admin', (req, res) => {
  db.get('SELECT id FROM users ORDER BY created_at ASC LIMIT 1', (err, firstUser) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!firstUser) {
      return res.status(404).json({ error: 'No users found' });
    }

    db.run('UPDATE users SET is_admin = 1 WHERE id = ?', [firstUser.id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'First user promoted to admin successfully', user_id: firstUser.id });
    });
  });
});

// Sign in
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if ((!email && !username) || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    // Determine if user is logging in with email or username
    const loginField = email || username;
    const isEmail = loginField.includes('@');
    
    const query = isEmail 
      ? 'SELECT id, email, password, full_name, username, is_admin FROM users WHERE email = ?'
      : 'SELECT id, email, password, full_name, username, is_admin FROM users WHERE username = ?';

    db.get(query, [loginField], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, full_name: user.full_name, username: user.username, is_admin: user.is_admin },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        user: { id: user.id, email: user.email, full_name: user.full_name, username: user.username, is_admin: user.is_admin },
        token
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Forgot password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    db.get('SELECT id, email, full_name FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ message: 'If an account with that email exists, a reset link has been sent' });
      }

      // Generate reset token (expires in 1 hour)
      const resetToken = jwt.sign(
        { id: user.id, email: user.email, type: 'password_reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Send password reset email
      const resetLink = `http://192.168.1.69:3001/reset-password.html?token=${resetToken}`;
      
      // Also log the direct app link for manual testing
      const directAppLink = `myfirstapp://reset-password?token=${resetToken}`;
      console.log(`Direct app link for testing: ${directAppLink}`);
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request - Ladder App',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Ladder App</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #1f2937; margin-top: 0;">Hello ${user.full_name},</h2>
              <p style="color: #6b7280; line-height: 1.6;">We received a request to reset your password for your Ladder account. Click the button below to reset your password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background: #4f46e5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #6b7280; line-height: 1.6; font-size: 14px;">
                <strong>Important:</strong> This link will expire in 1 hour for security reasons. If you didn't request this password reset, you can safely ignore this email.
              </p>
              
              <p style="color: #6b7280; line-height: 1.6; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetLink}" style="color: #4f46e5; word-break: break-all;">${resetLink}</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                This is an automated message from Ladder App. Please do not reply to this email.
              </p>
            </div>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);
        res.json({ message: 'If an account with that email exists, a reset link has been sent' });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Fallback to console logging for development
        console.log(`Password reset token for ${email}: ${resetToken}`);
        console.log(`Reset link: http://192.168.1.69:3001/reset-password.html?token=${resetToken}`);
        res.json({ message: 'If an account with that email exists, a reset link has been sent' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Verify and decode the reset token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid token type' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update the user's password
    db.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, decoded.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Password reset successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Change email - send verification email
app.post('/api/auth/change-email', authenticateToken, async (req, res) => {
  try {
    const { new_email } = req.body;
    const userId = req.user.id;

    if (!new_email) {
      return res.status(400).json({ error: 'New email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(new_email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if new email is different from current email
    db.get('SELECT email FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (user.email.toLowerCase() === new_email.toLowerCase()) {
        return res.status(400).json({ error: 'New email must be different from current email' });
      }

      // Check if new email is already in use
      db.get('SELECT id FROM users WHERE email = ? AND id != ?', [new_email, userId], (err, existingUser) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (existingUser) {
          return res.status(400).json({ error: 'Email is already in use' });
        }

        // Generate email change verification token
        const emailChangeToken = jwt.sign(
          { 
            id: userId, 
            new_email: new_email,
            type: 'email_change' 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Store pending email change
        db.run(
          'INSERT OR REPLACE INTO email_changes (user_id, new_email, token, created_at) VALUES (?, ?, ?, ?)',
          [userId, new_email, emailChangeToken, new Date().toISOString()],
          function(err) {
            if (err) {
              console.error('Error storing email change:', err);
              return res.status(500).json({ error: 'Database error' });
            }

            // Send verification email
            const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email-change?token=${emailChangeToken}`;
            
            const mailOptions = {
              from: process.env.EMAIL_USER,
              to: new_email,
              subject: 'Verify Your New Email Address - Ladder',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #4f46e5;">Verify Your New Email Address</h2>
                  <p>Hello,</p>
                  <p>You requested to change your email address for your Ladder account. To complete this change, please click the button below:</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Verify Email Address</a>
                  </div>
                  <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
                  <p><strong>Important:</strong></p>
                  <ul>
                    <li>This link will expire in 24 hours</li>
                    <li>Your old email will remain active for 30 days as a backup</li>
                    <li>If you didn't request this change, please ignore this email</li>
                  </ul>
                  <p>Best regards,<br>The Ladder Team</p>
                </div>
              `
            };

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ error: 'Failed to send verification email' });
              }
              console.log('Email change verification sent:', info.messageId);
              res.json({ message: 'Verification email sent to new address' });
            });
          }
        );
      });
    });
  } catch (error) {
    console.error('Email change error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify email change
app.post('/api/auth/verify-email-change', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Verify and decode the email change token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    if (decoded.type !== 'email_change') {
      return res.status(400).json({ error: 'Invalid token type' });
    }

    // Check if the token exists in our database
    db.get(
      'SELECT * FROM email_changes WHERE token = ? AND user_id = ?',
      [token, decoded.id],
      (err, emailChange) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!emailChange) {
          return res.status(400).json({ error: 'Invalid verification token' });
        }

        // Update user's email
        db.run(
          'UPDATE users SET email = ? WHERE id = ?',
          [decoded.new_email, decoded.id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            if (this.changes === 0) {
              return res.status(404).json({ error: 'User not found' });
            }

            // Clean up the email change record
            db.run('DELETE FROM email_changes WHERE token = ?', [token], (err) => {
              if (err) {
                console.error('Error cleaning up email change record:', err);
              }
            });

            res.json({ 
              message: 'Email updated successfully',
              new_email: decoded.new_email
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    if (current_password === new_password) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    // Get user's current password hash
    db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash the new password
      const hashedNewPassword = await bcrypt.hash(new_password, 10);

      // Update the user's password
      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedNewPassword, userId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
          }

          res.json({ message: 'Password changed successfully' });
        }
      );
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (admin only)
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  db.all(
    'SELECT id, email, full_name, is_admin, created_at FROM users ORDER BY created_at DESC',
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(users || []);
    }
  );
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  db.get(
    'SELECT p.*, u.email, u.full_name, u.username, u.is_admin FROM profiles p JOIN users u ON p.user_id = u.id WHERE p.user_id = ?',
    [req.user.id],
    (err, profile) => {
      if (err) {
        console.error('Database error fetching profile:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!profile) {
        // Profile doesn't exist, create one
        db.run(
          'INSERT INTO profiles (user_id) VALUES (?)',
          [req.user.id],
          function(err) {
            if (err) {
              console.error('Error creating profile:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            
            // Return basic user info
            res.json({
              user_id: req.user.id,
              full_name: req.user.full_name,
              username: req.user.username,
              email: req.user.email,
              is_admin: req.user.is_admin,
              bio: null,
              location: null,
              field: null,
              avatar_url: null,
              created_at: new Date().toISOString()
            });
          }
        );
      } else {
        // Ensure is_admin is included in the response
        res.json({
          ...profile,
          is_admin: profile.is_admin
        });
      }
    }
  );
});

// Update profile
app.put('/api/profile', authenticateToken, (req, res) => {
  const { full_name, username, bio, location, field, avatar_url } = req.body;
  
  // Validate username if provided
  if (username) {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }
    
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }
    
    // Check if username is already taken by another user
    db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.user.id], (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (existingUser) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      
      // Continue with update if username is available
      updateProfile();
    });
  } else {
    // No username update, proceed directly
    updateProfile();
  }
  
  function updateProfile() {
    // Update user table if full_name or username is provided
    if (full_name || username) {
      const userUpdates = [];
      const userValues = [];
      
      if (full_name) {
        userUpdates.push('full_name = ?');
        userValues.push(full_name);
      }
      if (username) {
        userUpdates.push('username = ?');
        userValues.push(username);
      }
      
      userValues.push(req.user.id);
      
      db.run(
        `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`,
        userValues,
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error updating user' });
          }
          updateProfileTable();
        }
      );
    } else {
      updateProfileTable();
    }
  }
  
  function updateProfileTable() {
    // Update profile table
    db.run(
      'UPDATE profiles SET bio = ?, location = ?, field = ?, avatar_url = ? WHERE user_id = ?',
      [bio, location, field, avatar_url, req.user.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error updating profile' });
        }
        res.json({ message: 'Profile updated successfully' });
      }
    );
  }
});

// Get user settings
app.get('/api/settings', authenticateToken, (req, res) => {
  db.get(
    'SELECT * FROM user_settings WHERE user_id = ?',
    [req.user.id],
    (err, settings) => {
      if (err) {
        console.error('Database error fetching settings:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!settings) {
        // Create default settings for user
        db.run(
          'INSERT INTO user_settings (user_id) VALUES (?)',
          [req.user.id],
          function(err) {
            if (err) {
              console.error('Error creating default settings:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            
            // Return default settings
            res.json({
              posts_on_profile_visibility: 'everyone',
              show_online_status: true,
              push_notifications: true,
              email_notifications: true,
              language: 'en'
            });
          }
        );
      } else {
        res.json({
          posts_on_profile_visibility: settings.posts_on_profile_visibility,
          show_online_status: Boolean(settings.show_online_status),
          push_notifications: Boolean(settings.push_notifications),
          email_notifications: Boolean(settings.email_notifications),
          language: settings.language
        });
      }
    }
  );
});

// Update user settings
app.put('/api/settings', authenticateToken, (req, res) => {
  const { 
    posts_on_profile_visibility, 
    show_online_status, 
    push_notifications, 
    email_notifications, 
    language 
  } = req.body;
  
  // Validate posts_on_profile_visibility
  if (posts_on_profile_visibility && !['everyone', 'connections', 'none'].includes(posts_on_profile_visibility)) {
    return res.status(400).json({ error: 'Invalid posts visibility setting' });
  }
  
  // Validate language
  if (language && !['en', 'el'].includes(language)) {
    return res.status(400).json({ error: 'Invalid language setting' });
  }
  
  // Check if settings exist
  db.get(
    'SELECT id FROM user_settings WHERE user_id = ?',
    [req.user.id],
    (err, existingSettings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (existingSettings) {
        // Update existing settings
        const updateFields = [];
        const updateValues = [];
        
        if (posts_on_profile_visibility !== undefined) {
          updateFields.push('posts_on_profile_visibility = ?');
          updateValues.push(posts_on_profile_visibility);
        }
        if (show_online_status !== undefined) {
          updateFields.push('show_online_status = ?');
          updateValues.push(show_online_status ? 1 : 0);
        }
        if (push_notifications !== undefined) {
          updateFields.push('push_notifications = ?');
          updateValues.push(push_notifications ? 1 : 0);
        }
        if (email_notifications !== undefined) {
          updateFields.push('email_notifications = ?');
          updateValues.push(email_notifications ? 1 : 0);
        }
        if (language !== undefined) {
          updateFields.push('language = ?');
          updateValues.push(language);
        }
        
        if (updateFields.length === 0) {
          return res.status(400).json({ error: 'No valid settings provided' });
        }
        
        updateFields.push('updated_at = ?');
        updateValues.push(new Date().toISOString());
        updateValues.push(req.user.id);
        
        db.run(
          `UPDATE user_settings SET ${updateFields.join(', ')} WHERE user_id = ?`,
          updateValues,
          function(err) {
            if (err) {
              console.error('Error updating settings:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Settings updated successfully' });
          }
        );
      } else {
        // Create new settings
        db.run(
          'INSERT INTO user_settings (user_id, posts_on_profile_visibility, show_online_status, push_notifications, email_notifications, language) VALUES (?, ?, ?, ?, ?, ?)',
          [
            req.user.id,
            posts_on_profile_visibility || 'everyone',
            show_online_status !== undefined ? (show_online_status ? 1 : 0) : 1,
            push_notifications !== undefined ? (push_notifications ? 1 : 0) : 1,
            email_notifications !== undefined ? (email_notifications ? 1 : 0) : 1,
            language || 'en'
          ],
          function(err) {
            if (err) {
              console.error('Error creating settings:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Settings created successfully' });
          }
        );
      }
    }
  );
});

// Delete user account
app.delete('/api/auth/delete-account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Delete user settings
    db.run('DELETE FROM user_settings WHERE user_id = ?', [userId], (err) => {
      if (err) {
        console.error('Error deleting user settings:', err);
      }
    });
    
    // Delete user profile
    db.run('DELETE FROM profiles WHERE user_id = ?', [userId], (err) => {
      if (err) {
        console.error('Error deleting user profile:', err);
      }
    });
    
    // Delete user opportunities
    db.run('DELETE FROM opportunities WHERE created_by = ?', [userId], (err) => {
      if (err) {
        console.error('Error deleting user opportunities:', err);
      }
    });
    
    // Delete user applications
    db.run('DELETE FROM applications WHERE user_id = ?', [userId], (err) => {
      if (err) {
        console.error('Error deleting user applications:', err);
      }
    });
    
    // Delete user favorites
    db.run('DELETE FROM favorites WHERE user_id = ?', [userId], (err) => {
      if (err) {
        console.error('Error deleting user favorites:', err);
      }
    });
    
    // Finally delete the user
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
      if (err) {
        console.error('Error deleting user:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ message: 'Account deleted successfully' });
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get opportunities
app.get('/api/opportunities', (req, res) => {
  db.all(
    `SELECT o.*, u.full_name as author_name 
     FROM opportunities o 
     LEFT JOIN users u ON o.created_by = u.id 
     ORDER BY o.created_at DESC`,
    (err, opportunities) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      console.log('Fetched opportunities:', opportunities);
      res.json(opportunities || []);
    }
  );
});

// Get user's own opportunities
app.get('/api/opportunities/my', authenticateToken, (req, res) => {
  db.all(
    `SELECT o.*, u.full_name as author_name
     FROM opportunities o 
     LEFT JOIN users u ON o.created_by = u.id 
     WHERE o.created_by = ?
     ORDER BY o.created_at DESC`,
    [req.user.id],
    (err, opportunities) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      console.log('Fetched user opportunities:', opportunities);
      res.json(opportunities || []);
    }
  );
});

// Create opportunity
app.post('/api/opportunities', authenticateToken, (req, res) => {
  const { 
    title, 
    description, 
    category, 
    location, 
    field, 
    image_url, 
    deadline, 
    requirements, 
    contact_info, 
    application_url, 
    is_external_application 
  } = req.body;

  console.log('Creating opportunity:', { 
    title, 
    description, 
    category, 
    location, 
    field, 
    image_url, 
    deadline, 
    requirements, 
    contact_info, 
    application_url, 
    is_external_application, 
    userId: req.user.id 
  });

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  db.run(
    `INSERT INTO opportunities (
      title, description, category, location, field, image_url, 
      deadline, requirements, contact_info, application_url, is_external_application, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title, description, category, location, field, image_url, 
      deadline || null, requirements || null, contact_info || null, 
      application_url || null, is_external_application || false, req.user.id
    ],
    function(err) {
      if (err) {
        console.error('Error creating opportunity:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      console.log('Opportunity created successfully with ID:', this.lastID);
      res.json({ id: this.lastID, message: 'Opportunity created successfully' });
    }
  );
});

// Delete opportunity (only by the creator)
app.delete('/api/opportunities/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  console.log('Deleting opportunity:', { opportunityId: id, userId: req.user.id });

  // First check if the opportunity exists and belongs to the user
  db.get(
    'SELECT created_by FROM opportunities WHERE id = ?',
    [id],
    (err, opportunity) => {
      if (err) {
        console.error('Error checking opportunity:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!opportunity) {
        return res.status(404).json({ error: 'Opportunity not found' });
      }

      if (opportunity.created_by !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete your own opportunities' });
      }

      // Delete the opportunity
      db.run(
        'DELETE FROM opportunities WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            console.error('Error deleting opportunity:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          console.log('Opportunity deleted successfully');
          res.json({ message: 'Opportunity deleted successfully' });
        }
      );
    }
  );
});

// Get user favorites
app.get('/api/favorites', authenticateToken, (req, res) => {
  db.all(
    `SELECT o.*, u.full_name as author_name 
     FROM favorites f 
     JOIN opportunities o ON f.opportunity_id = o.id 
     JOIN users u ON o.created_by = u.id 
     WHERE f.user_id = ?`,
    [req.user.id],
    (err, favorites) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(favorites);
    }
  );
});

// Add to favorites
app.post('/api/favorites', authenticateToken, (req, res) => {
  const { opportunity_id } = req.body;

  if (!opportunity_id) {
    return res.status(400).json({ error: 'Opportunity ID is required' });
  }

  db.run(
    'INSERT OR IGNORE INTO favorites (user_id, opportunity_id) VALUES (?, ?)',
    [req.user.id, opportunity_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Added to favorites' });
    }
  );
});

// Remove from favorites
app.delete('/api/favorites/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM favorites WHERE user_id = ? AND opportunity_id = ?',
    [req.user.id, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Removed from favorites' });
    }
  );
});

// Application Routes

// Apply for an opportunity
app.post('/api/applications', authenticateToken, (req, res) => {
  const { opportunity_id, notes } = req.body;

  if (!opportunity_id) {
    return res.status(400).json({ error: 'Opportunity ID is required' });
  }

  // Check if opportunity exists
  db.get('SELECT id FROM opportunities WHERE id = ?', [opportunity_id], (err, opportunity) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Check if user already applied
    db.get('SELECT id FROM applications WHERE user_id = ? AND opportunity_id = ?', 
      [req.user.id, opportunity_id], (err, existingApplication) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (existingApplication) {
        return res.status(400).json({ error: 'You have already applied for this opportunity' });
      }

      // Create application
      db.run(
        'INSERT INTO applications (user_id, opportunity_id, notes) VALUES (?, ?, ?)',
        [req.user.id, opportunity_id, notes || null],
        function(err) {
          if (err) {
            console.error('Error creating application:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          console.log('Application created successfully with ID:', this.lastID);
          res.json({ 
            id: this.lastID, 
            message: 'Application submitted successfully' 
          });
        }
      );
    });
  });
});

// Get user's applications
app.get('/api/applications', authenticateToken, (req, res) => {
  db.all(
    `SELECT a.*, o.title as opportunity_title, o.description, o.category, o.location, o.field,
            u.full_name as author_name
     FROM applications a 
     JOIN opportunities o ON a.opportunity_id = o.id 
     JOIN users u ON o.created_by = u.id 
     WHERE a.user_id = ?
     ORDER BY a.created_at DESC`,
    [req.user.id],
    (err, applications) => {
      if (err) {
        console.error('Error fetching applications:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      console.log('Fetched applications:', applications);
      res.json(applications || []);
    }
  );
});

// Update application status (for opportunity creators)
app.put('/api/applications/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['applied', 'interviewing', 'accepted', 'rejected', 'waitlisted'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }

  // Check if application exists and user owns the opportunity
  db.get(
    `SELECT a.id, o.created_by 
     FROM applications a 
     JOIN opportunities o ON a.opportunity_id = o.id 
     WHERE a.id = ?`,
    [id],
    (err, application) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }
      if (application.created_by !== req.user.id) {
        return res.status(403).json({ error: 'You can only update applications for your own opportunities' });
      }

      // Update status
      db.run(
        'UPDATE applications SET status = ? WHERE id = ?',
        [status, id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ message: 'Application status updated successfully' });
        }
      );
    }
  );
});

// Remove application
app.delete('/api/applications/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  // Check if application exists and belongs to user
  db.get('SELECT user_id FROM applications WHERE id = ?', [id], (err, application) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    if (application.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only remove your own applications' });
    }

    // Delete application
    db.run('DELETE FROM applications WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Application removed successfully' });
    });
  });
});

// Check if user has applied for an opportunity
app.get('/api/applications/check/:opportunity_id', authenticateToken, (req, res) => {
  const { opportunity_id } = req.params;

  db.get(
    'SELECT id, status, created_at FROM applications WHERE user_id = ? AND opportunity_id = ?',
    [req.user.id, opportunity_id],
    (err, application) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ hasApplied: !!application, application: application || null });
    }
  );
});

console.log('About to start server on port:', PORT);

const server = app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('Server startup error:', err);
    return;
  }
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible at http://localhost:${PORT}`);
  console.log(`Server accessible at http://172.20.10.2:${PORT}`);
  console.log('Server is ready to accept connections!');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

console.log('Server listen call completed');

// Add error handling
app.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
