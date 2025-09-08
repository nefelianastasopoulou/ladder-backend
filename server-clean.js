const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database using safe migration
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

    if (!email || !password || !full_name || !username) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (row) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      db.run(
        'INSERT INTO users (email, password, full_name, username, is_admin) VALUES (?, ?, ?, ?, ?)',
        [email, hashedPassword, full_name, username, 0],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Generate JWT token
          const token = jwt.sign(
            { id: this.lastID, email, username, is_admin: false },
            JWT_SECRET,
            { expiresIn: '7d' }
          );

          res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: this.lastID, email, username, full_name, is_admin: false }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, username, password } = req.body;

  if (!password || (!email && !username)) {
    return res.status(400).json({ error: 'Email/username and password are required' });
  }

  // Determine if login is by email or username
  const query = email && email.includes('@')
    ? 'SELECT id, email, password, full_name, username, is_admin FROM users WHERE email = ?'
    : 'SELECT id, email, password, full_name, username, is_admin FROM users WHERE username = ?';
  
  const queryParam = email && email.includes('@') ? email : username;

  db.get(query, [queryParam], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, username: user.username, full_name: user.full_name, is_admin: user.is_admin }
    });
  });
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

// Start server
console.log('About to start server on port:', PORT);

const server = app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('Server startup error:', err);
    return;
  }
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    db.close();
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    db.close();
  });
});
