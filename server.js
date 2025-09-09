const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
// Removed file-type dependency - using multer validation instead
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only allow 1 file per request
  },
  fileFilter: (req, file, cb) => {
    // Only allow specific image types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed!'), false);
    }
    
    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error('Invalid file extension!'), false);
    }
    
    cb(null, true);
  }
});

// Middleware to check photo upload restrictions
const checkPhotoUploadRestrictions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user's photo upload settings
    db.get(
      'SELECT photo_upload_restriction, allowed_photo_sources FROM user_settings WHERE user_id = ?',
      [userId],
      (err, settings) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        const restriction = settings?.photo_upload_restriction || 'all';
        const allowedSources = settings?.allowed_photo_sources ? JSON.parse(settings.allowed_photo_sources) : [];
        
        // If restriction is 'all', allow all photos
        if (restriction === 'all') {
          return next();
        }
        
        // If restriction is 'restricted', check if user has selected any allowed sources
        if (restriction === 'restricted') {
          if (!allowedSources || allowedSources.length === 0) {
            return res.status(403).json({ 
              error: 'Photo upload is restricted. Please configure allowed photo sources in your settings.' 
            });
          }
          
          // For now, we'll allow the upload but in a real app, you'd check the source
          // This could be enhanced to check metadata, EXIF data, or other indicators
          return next();
        }
        
        next();
      }
    );
  } catch (error) {
    return res.status(500).json({ error: 'Error checking photo restrictions' });
  }
};

// Middleware to validate uploaded image files
const validateImageFile = async (req, res, next) => {
  if (!req.file) {
    return next(); // No file uploaded, continue
  }
  
  try {
    const filePath = req.file.path;
    // Check if file exists and has content
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      return res.status(400).json({ error: 'Invalid file uploaded!' });
    }
    
    next();
  } catch (error) {
    // If there's an error reading the file, delete it and return error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting invalid file:', unlinkError);
      }
    }
    return res.status(400).json({ error: 'Invalid file format!' });
  }
};

// Serve uploaded files statically with security headers
app.use('/uploads', (req, res, next) => {
  // Set security headers for uploaded files
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Only allow image files to be served
  const filePath = path.join(__dirname, 'uploads', req.path);
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExtension = path.extname(req.path).toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  next();
}, express.static('uploads'));

// Database connection is now handled in database.js

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

// Health check route
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Ladder Backend is running', version: '1.0.0' });
});

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

// Search users endpoint
app.get('/api/search/users', authenticateToken, (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim() === '') {
    return res.json([]);
  }
  
  const searchTerm = `%${q.trim()}%`;
  
  db.all(
    `SELECT id, email, full_name, username, is_admin, created_at 
     FROM users 
     WHERE full_name LIKE ? OR username LIKE ?
     ORDER BY 
       CASE 
         WHEN full_name LIKE ? THEN 1
         WHEN username LIKE ? THEN 2
         ELSE 3
       END,
       created_at DESC
     LIMIT 20`,
    [searchTerm, searchTerm, searchTerm, searchTerm],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(users || []);
    }
  );
});

// Search posts endpoint
app.get('/api/search/posts', authenticateToken, (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim() === '') {
    return res.json([]);
  }
  
  const searchTerm = `%${q.trim()}%`;
  
  db.all(
    `SELECT p.id, p.title, p.content, p.category, p.likes_count, p.comments_count, p.created_at,
            u.full_name as author_name, u.username as author_username,
            c.name as community_name
     FROM posts p
     LEFT JOIN users u ON p.author_id = u.id
     LEFT JOIN communities c ON p.community_id = c.id
     WHERE p.is_published = 1 AND (p.title LIKE ? OR p.content LIKE ?)
     ORDER BY 
       CASE 
         WHEN p.title LIKE ? THEN 1
         WHEN p.content LIKE ? THEN 2
         ELSE 3
       END,
       p.created_at DESC
     LIMIT 20`,
    [searchTerm, searchTerm, searchTerm, searchTerm],
    (err, posts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(posts || []);
    }
  );
});

// Search communities endpoint
app.get('/api/search/communities', authenticateToken, (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim() === '') {
    return res.json([]);
  }
  
  const searchTerm = `%${q.trim()}%`;
  
  db.all(
    `SELECT c.id, c.name, c.description, c.category, c.member_count, c.is_public, c.created_at,
            u.full_name as creator_name, u.username as creator_username
     FROM communities c
     LEFT JOIN users u ON c.created_by = u.id
     WHERE c.is_public = 1 AND (c.name LIKE ? OR c.description LIKE ?)
     ORDER BY 
       CASE 
         WHEN c.name LIKE ? THEN 1
         WHEN c.description LIKE ? THEN 2
         ELSE 3
       END,
       c.member_count DESC, c.created_at DESC
     LIMIT 20`,
    [searchTerm, searchTerm, searchTerm, searchTerm],
    (err, communities) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(communities || []);
    }
  );
});

// Combined search endpoint
app.get('/api/search/all', authenticateToken, (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim() === '') {
    return res.json({ users: [], posts: [], communities: [] });
  }
  
  const searchTerm = `%${q.trim()}%`;
  
  // Search users
  db.all(
    `SELECT id, email, full_name, username, is_admin, created_at, 'user' as type
     FROM users 
     WHERE full_name LIKE ? OR username LIKE ?
     ORDER BY 
       CASE 
         WHEN full_name LIKE ? THEN 1
         WHEN username LIKE ? THEN 2
         ELSE 3
       END
     LIMIT 10`,
    [searchTerm, searchTerm, searchTerm, searchTerm],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Search posts
      db.all(
        `SELECT p.id, p.title, p.content, p.category, p.likes_count, p.comments_count, p.created_at,
                u.full_name as author_name, u.username as author_username,
                c.name as community_name, 'post' as type
         FROM posts p
         LEFT JOIN users u ON p.author_id = u.id
         LEFT JOIN communities c ON p.community_id = c.id
         WHERE p.is_published = 1 AND (p.title LIKE ? OR p.content LIKE ?)
         ORDER BY 
           CASE 
             WHEN p.title LIKE ? THEN 1
             WHEN p.content LIKE ? THEN 2
             ELSE 3
           END
         LIMIT 10`,
        [searchTerm, searchTerm, searchTerm, searchTerm],
        (err, posts) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          // Search communities
          db.all(
            `SELECT c.id, c.name, c.description, c.category, c.member_count, c.is_public, c.created_at,
                    u.full_name as creator_name, u.username as creator_username, 'community' as type
             FROM communities c
             LEFT JOIN users u ON c.created_by = u.id
             WHERE c.is_public = 1 AND (c.name LIKE ? OR c.description LIKE ?)
             ORDER BY 
               CASE 
                 WHEN c.name LIKE ? THEN 1
                 WHEN c.description LIKE ? THEN 2
                 ELSE 3
               END
             LIMIT 10`,
            [searchTerm, searchTerm, searchTerm, searchTerm],
            (err, communities) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }
              
              res.json({
                users: users || [],
                posts: posts || [],
                communities: communities || []
              });
            }
          );
        }
      );
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
app.post('/api/auth/signin', (req, res) => {
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

// Profile endpoint
app.get('/api/profile', authenticateToken, (req, res) => {
  db.get(
    'SELECT id, email, full_name, username, is_admin, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    }
  );
});

// Update profile endpoint
app.put('/api/profile', authenticateToken, (req, res) => {
  const { full_name, username, bio, location, field, avatar_url } = req.body;
  
  // Check if username is being changed and if it already exists
  if (username) {
    db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.user.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (row) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      // Update profile
      updateProfile();
    });
  } else {
    updateProfile();
  }
  
  function updateProfile() {
    const updateFields = [];
    const values = [];
    
    if (full_name !== undefined) {
      updateFields.push('full_name = ?');
      values.push(full_name);
    }
    if (username !== undefined) {
      updateFields.push('username = ?');
      values.push(username);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(req.user.id);
    
    db.run(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Update profile table if it exists
        db.run(
          `INSERT OR REPLACE INTO user_profiles (
            user_id, bio, location, field, avatar_url
          ) VALUES (?, ?, ?, ?, ?)`,
          [req.user.id, bio || '', location || '', field || '', avatar_url || ''],
          (err) => {
            if (err) {
              console.error('Error updating profile:', err);
            }
            res.json({ message: 'Profile updated successfully' });
          }
        );
      }
    );
  }
});

// Settings endpoints
app.get('/api/settings', authenticateToken, (req, res) => {
  db.get(
    'SELECT * FROM user_settings WHERE user_id = ?',
    [req.user.id],
    (err, settings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      // Return default settings if none exist
      const defaultSettings = {
        email_notifications: true,
        push_notifications: true,
        sound_vibration: true,
        location_services: true,
        language: 'en',
        show_activity_status: true,
        show_last_seen: true,
        allow_direct_messages: true,
        allow_connection_requests: true,
        community_posts_visibility: 'everyone',
        photo_upload_restriction: 'all',
        allowed_photo_sources: '[]'
      };
      res.json(settings || defaultSettings);
    }
  );
});

app.put('/api/settings', authenticateToken, (req, res) => {
  const settings = req.body;
  
  db.run(
    `INSERT OR REPLACE INTO user_settings (
      user_id, email_notifications, push_notifications, sound_vibration, 
      location_services, language, show_activity_status, show_last_seen,
      allow_direct_messages, allow_connection_requests, community_posts_visibility,
      photo_upload_restriction, allowed_photo_sources
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id,
      settings.email_notifications,
      settings.push_notifications,
      settings.sound_vibration,
      settings.location_services,
      settings.language,
      settings.show_activity_status,
      settings.show_last_seen,
      settings.allow_direct_messages,
      settings.allow_connection_requests,
      settings.community_posts_visibility,
      settings.photo_upload_restriction || 'all',
      settings.allowed_photo_sources || '[]'
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Settings updated successfully' });
    }
  );
});

// Opportunities endpoints
app.get('/api/opportunities', (req, res) => {
  db.all(
    'SELECT * FROM opportunities ORDER BY created_at DESC',
    (err, opportunities) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(opportunities || []);
    }
  );
});

app.get('/api/opportunities/my', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM opportunities WHERE created_by = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, opportunities) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(opportunities || []);
    }
  );
});

// Applications endpoints
app.get('/api/applications', authenticateToken, (req, res) => {
  db.all(
    `SELECT a.*, o.title, o.description, o.category, o.location 
     FROM applications a 
     JOIN opportunities o ON a.opportunity_id = o.id 
     WHERE a.user_id = ? 
     ORDER BY a.applied_date DESC`,
    [req.user.id],
    (err, applications) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(applications || []);
    }
  );
});

// Favorites endpoints
app.get('/api/favorites', authenticateToken, (req, res) => {
  db.all(
    `SELECT o.* FROM opportunities o 
     JOIN favorites f ON o.id = f.opportunity_id 
     WHERE f.user_id = ? 
     ORDER BY f.created_at DESC`,
    [req.user.id],
    (err, favorites) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(favorites || []);
    }
  );
});

// Communities endpoints
app.get('/api/communities', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  db.all(
    `SELECT c.*, u.full_name as creator_name, u.username as creator_username,
            CASE WHEN cm.user_id IS NOT NULL THEN 1 ELSE 0 END as is_member
     FROM communities c
     LEFT JOIN users u ON c.created_by = u.id
     LEFT JOIN community_members cm ON c.id = cm.community_id AND cm.user_id = ?
     WHERE c.is_public = 1
     ORDER BY c.member_count DESC, c.created_at DESC`,
    [userId],
    (err, communities) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(communities || []);
    }
  );
});

// Get posts for a specific community
app.get('/api/communities/:id/posts', authenticateToken, (req, res) => {
  const communityId = req.params.id;
  
  db.all(
    `SELECT p.id, p.title, p.content, p.likes_count, p.comments_count, p.created_at,
            u.full_name as author_name, u.username as author_username
     FROM posts p
     LEFT JOIN users u ON p.author_id = u.id
     WHERE p.community_id = ?
     ORDER BY p.created_at DESC`,
    [communityId],
    (err, posts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(posts || []);
    }
  );
});

// Create a new post in a community
app.post('/api/communities/:id/posts', authenticateToken, checkPhotoUploadRestrictions, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Too many files. Only 1 file allowed.' });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, validateImageFile, (req, res) => {
  const communityId = req.params.id;
  const { title, content } = req.body;
  const userId = req.user.id;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  
  if (content.length < 10) {
    return res.status(400).json({ error: 'Content must be at least 10 characters long' });
  }
  
  // Check if user is a member of the community
  db.get(
    'SELECT id FROM community_members WHERE community_id = ? AND user_id = ?',
    [communityId, userId],
    (err, membership) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!membership) {
        return res.status(403).json({ error: 'You must be a member of this community to post' });
      }
      
      // Create the post
      db.run(
        'INSERT INTO posts (title, content, author_id, community_id, image_url, likes_count, comments_count, created_at) VALUES (?, ?, ?, ?, ?, 0, 0, CURRENT_TIMESTAMP)',
        [title, content, userId, communityId, imageUrl],
        function(err) {
          if (err) {
            console.error('Error creating post:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          // Update community post count
          db.run(
            'UPDATE communities SET post_count = post_count + 1 WHERE id = ?',
            [communityId],
            (err) => {
              if (err) {
                console.error('Error updating community post count:', err);
              }
            }
          );
          
          res.status(201).json({
            message: 'Post created successfully',
            post_id: this.lastID
          });
        }
      );
    }
  );
});

// Create a platform-wide post (not in a specific community)
app.post('/api/posts', authenticateToken, checkPhotoUploadRestrictions, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Too many files. Only 1 file allowed.' });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, validateImageFile, (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  
  if (content.length < 10) {
    return res.status(400).json({ error: 'Content must be at least 10 characters long' });
  }
  
  // Create the post (community_id will be NULL for platform-wide posts)
  db.run(
    'INSERT INTO posts (title, content, author_id, community_id, image_url, likes_count, comments_count, created_at) VALUES (?, ?, ?, NULL, ?, 0, 0, CURRENT_TIMESTAMP)',
    [title, content, userId, imageUrl],
    function(err) {
      if (err) {
        console.error('Error creating platform post:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({
        message: 'Post created successfully',
        post_id: this.lastID
      });
    }
  );
});

// Update community settings (creator only)
app.put('/api/communities/:id', authenticateToken, (req, res) => {
  const communityId = req.params.id;
  const { name, description, is_public } = req.body;
  const userId = req.user.id;
  
  // Check if user is the creator
  db.get('SELECT created_by FROM communities WHERE id = ?', [communityId], (err, community) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }
    if (community.created_by !== userId) {
      return res.status(403).json({ error: 'Only the creator can update community settings' });
    }
    
    // Check if new name already exists (if name is being changed)
    if (name) {
      db.get('SELECT id FROM communities WHERE name = ? AND id != ?', [name, communityId], (err, existingCommunity) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (existingCommunity) {
          return res.status(400).json({ error: 'Community name already exists' });
        }
        
        updateCommunity();
      });
    } else {
      updateCommunity();
    }
    
    function updateCommunity() {
      const updateFields = [];
      const values = [];
      
      if (name !== undefined) {
        updateFields.push('name = ?');
        values.push(name);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        values.push(description);
      }
      if (is_public !== undefined) {
        updateFields.push('is_public = ?');
        values.push(is_public ? 1 : 0);
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      
      values.push(communityId);
      
      db.run(
        `UPDATE communities SET ${updateFields.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ message: 'Community updated successfully' });
        }
      );
    }
  });
});

app.post('/api/communities', authenticateToken, (req, res) => {
  const { name, description, category } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  // Check if community name already exists
  db.get('SELECT id FROM communities WHERE name = ?', [name], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (row) {
      return res.status(400).json({ error: 'Community name already exists' });
    }
    
    // Create community
    db.run(
      'INSERT INTO communities (name, description, category, created_by, member_count, is_public) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, category || '', req.user.id, 1, 1],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Add creator as first member
        db.run(
          'INSERT INTO community_members (user_id, community_id, role) VALUES (?, ?, ?)',
          [req.user.id, this.lastID, 'admin'],
          (err) => {
            if (err) {
              console.error('Error adding creator as member:', err);
            }
          }
        );
        
        res.status(201).json({
          message: 'Community created successfully',
          community: {
            id: this.lastID,
            name,
            description,
            category: category || '',
            created_by: req.user.id,
            member_count: 1,
            is_public: 1
          }
        });
      }
    );
  });
});

// Join community endpoint
app.post('/api/communities/:id/join', authenticateToken, (req, res) => {
  const communityId = req.params.id;
  const userId = req.user.id;

  // Check if community exists
  db.get('SELECT * FROM communities WHERE id = ?', [communityId], (err, community) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Check if user is already a member
    db.get('SELECT * FROM community_members WHERE user_id = ? AND community_id = ?', [userId, communityId], (err, existingMember) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (existingMember) {
        return res.status(400).json({ error: 'You are already a member of this community' });
      }

      // Add user to community
      db.run(
        'INSERT INTO community_members (user_id, community_id, role) VALUES (?, ?, ?)',
        [userId, communityId, 'member'],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Update member count
          db.run(
            'UPDATE communities SET member_count = member_count + 1 WHERE id = ?',
            [communityId],
            (err) => {
              if (err) {
                console.error('Error updating member count:', err);
              }
            }
          );

          res.json({
            message: 'Successfully joined the community',
            community: {
              id: community.id,
              name: community.name,
              member_count: community.member_count + 1
            }
          });
        }
      );
    });
  });
});

// Leave community endpoint
app.post('/api/communities/:id/leave', authenticateToken, (req, res) => {
  const communityId = req.params.id;
  const userId = req.user.id;

  // Check if user is a member
  db.get('SELECT * FROM community_members WHERE user_id = ? AND community_id = ?', [userId, communityId], (err, member) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!member) {
      return res.status(400).json({ error: 'You are not a member of this community' });
    }

    // Remove user from community
    db.run(
      'DELETE FROM community_members WHERE user_id = ? AND community_id = ?',
      [userId, communityId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // Update member count
        db.run(
          'UPDATE communities SET member_count = member_count - 1 WHERE id = ?',
          [communityId],
          (err) => {
            if (err) {
              console.error('Error updating member count:', err);
            }
          }
        );

        res.json({
          message: 'Successfully left the community'
        });
      }
    );
  });
});

// ==================== CHAT API ENDPOINTS ====================

// Get all conversations for a user
app.get('/api/conversations', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  const query = `
    SELECT DISTINCT c.*, 
           u.full_name as other_user_name,
           u.username as other_user_username,
           p.avatar_url as other_user_avatar,
           m.content as last_message,
           m.created_at as last_message_time,
           m.sender_id as last_message_sender_id,
           (SELECT COUNT(*) FROM messages m2 
            WHERE m2.conversation_id = c.id 
            AND m2.is_read = 0 
            AND m2.sender_id != ?) as unread_count
    FROM conversations c
    JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    JOIN users u ON cp2.user_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    LEFT JOIN messages m ON c.id = m.conversation_id
    WHERE cp1.user_id = ? 
    AND cp2.user_id != ?
    AND (m.id IS NULL OR m.id = (
      SELECT MAX(id) FROM messages m3 
      WHERE m3.conversation_id = c.id
    ))
    ORDER BY COALESCE(m.created_at, c.updated_at) DESC
  `;
  
  db.all(query, [userId, userId, userId], (err, rows) => {
    if (err) {
      console.error('Error fetching conversations:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const conversations = rows.map(row => ({
      id: row.id,
      type: row.type,
      name: row.name || row.other_user_name,
      other_user: {
        id: row.other_user_username ? 
          db.get('SELECT id FROM users WHERE username = ?', [row.other_user_username], (err, user) => {
            if (err) return null;
            return user.id;
          }) : null,
        name: row.other_user_name,
        username: row.other_user_username,
        avatar: row.other_user_avatar
      },
      last_message: row.last_message,
      last_message_time: row.last_message_time,
      last_message_sender_id: row.last_message_sender_id,
      unread_count: row.unread_count || 0,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    res.json(conversations);
  });
});

// Create or get individual conversation
app.post('/api/conversations/individual', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { other_user_id } = req.body;
  
  if (!other_user_id) {
    return res.status(400).json({ error: 'other_user_id is required' });
  }
  
  // Check if conversation already exists
  const checkQuery = `
    SELECT c.id 
    FROM conversations c
    JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE c.type = 'individual'
    AND cp1.user_id = ? AND cp2.user_id = ?
  `;
  
  db.get(checkQuery, [userId, other_user_id], (err, existing) => {
    if (err) {
      console.error('Error checking existing conversation:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (existing) {
      return res.json({ 
        conversation_id: existing.id,
        message: 'Conversation already exists'
      });
    }
    
    // Create new conversation
    db.run(
      'INSERT INTO conversations (type, created_by) VALUES (?, ?)',
      ['individual', userId],
      function(err) {
        if (err) {
          console.error('Error creating conversation:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        const conversationId = this.lastID;
        
        // Add participants
        db.run(
          'INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)',
          [conversationId, userId],
          (err) => {
            if (err) {
              console.error('Error adding participant 1:', err);
              return res.status(500).json({ error: 'Database error' });
            }
          }
        );
        
        db.run(
          'INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)',
          [conversationId, other_user_id],
          (err) => {
            if (err) {
              console.error('Error adding participant 2:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            
            res.status(201).json({
              conversation_id: conversationId,
              message: 'Conversation created successfully'
            });
          }
        );
      }
    );
  });
});

// Get messages for a conversation
app.get('/api/conversations/:id/messages', authenticateToken, (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user.id;
  
  // Verify user is participant
  db.get(
    'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
    [conversationId, userId],
    (err, participant) => {
      if (err) {
        console.error('Error checking participant:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!participant) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Get messages
      const query = `
        SELECT m.*, u.full_name as sender_name, u.username as sender_username
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC
      `;
      
      db.all(query, [conversationId], (err, messages) => {
        if (err) {
          console.error('Error fetching messages:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Mark messages as read
        db.run(
          'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?',
          [conversationId, userId],
          (err) => {
            if (err) {
              console.error('Error marking messages as read:', err);
            }
          }
        );
        
        res.json(messages);
      });
    }
  );
});

// Send a message
app.post('/api/conversations/:id/messages', authenticateToken, (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user.id;
  const { content, message_type = 'text' } = req.body;
  
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Message content is required' });
  }
  
  // Verify user is participant
  db.get(
    'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
    [conversationId, userId],
    (err, participant) => {
      if (err) {
        console.error('Error checking participant:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!participant) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Insert message
      db.run(
        'INSERT INTO messages (conversation_id, sender_id, content, message_type) VALUES (?, ?, ?, ?)',
        [conversationId, userId, content.trim(), message_type],
        function(err) {
          if (err) {
            console.error('Error sending message:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          // Update conversation timestamp
          db.run(
            'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [conversationId],
            (err) => {
              if (err) {
                console.error('Error updating conversation timestamp:', err);
              }
            }
          );
          
          res.status(201).json({
            message_id: this.lastID,
            message: 'Message sent successfully'
          });
        }
      );
    }
  );
});

// ==================== ADMIN DELETION ENDPOINTS ====================

// Admin: Delete a community
app.delete('/api/admin/communities/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const communityId = req.params.id;
  
  // Check if user is admin
  db.get('SELECT is_admin FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('Error checking admin status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Delete community and related data
    db.serialize(() => {
      // Delete messages in community posts
      db.run('DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE type = "community" AND name LIKE ?)', [`%Community ${communityId}%`]);
      
      // Delete community members
      db.run('DELETE FROM community_members WHERE community_id = ?', [communityId]);
      
      // Delete posts in community
      db.run('DELETE FROM posts WHERE community_id = ?', [communityId]);
      
      // Delete the community
      db.run('DELETE FROM communities WHERE id = ?', [communityId], function(err) {
        if (err) {
          console.error('Error deleting community:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Community not found' });
        }
        
        res.json({ message: 'Community deleted successfully' });
      });
    });
  });
});

// Admin: Delete a post
app.delete('/api/admin/posts/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const postId = req.params.id;
  
  // Check if user is admin
  db.get('SELECT is_admin FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('Error checking admin status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Delete the post
    db.run('DELETE FROM posts WHERE id = ?', [postId], function(err) {
      if (err) {
        console.error('Error deleting post:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      res.json({ message: 'Post deleted successfully' });
    });
  });
});

// Admin: Delete a user
app.delete('/api/admin/users/:id', authenticateToken, (req, res) => {
  const adminId = req.user.id;
  const userId = req.params.id;
  
  // Check if admin is trying to delete themselves
  if (parseInt(adminId) === parseInt(userId)) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  // Check if user is admin
  db.get('SELECT is_admin FROM users WHERE id = ?', [adminId], (err, admin) => {
    if (err) {
      console.error('Error checking admin status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!admin || !admin.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Delete user and related data
    db.serialize(() => {
      // Delete user's messages
      db.run('DELETE FROM messages WHERE sender_id = ?', [userId]);
      
      // Delete user's posts
      db.run('DELETE FROM posts WHERE author_id = ?', [userId]);
      
      // Delete user's communities
      db.run('DELETE FROM communities WHERE created_by = ?', [userId]);
      
      // Delete community memberships
      db.run('DELETE FROM community_members WHERE user_id = ?', [userId]);
      
      // Delete conversation participations
      db.run('DELETE FROM conversation_participants WHERE user_id = ?', [userId]);
      
      // Delete user's applications
      db.run('DELETE FROM applications WHERE user_id = ?', [userId]);
      
      // Delete user's favorites
      db.run('DELETE FROM favorites WHERE user_id = ?', [userId]);
      
      // Delete user's opportunities
      db.run('DELETE FROM opportunities WHERE created_by = ?', [userId]);
      
      // Delete user's profile
      db.run('DELETE FROM profiles WHERE user_id = ?', [userId]);
      
      // Delete user's settings
      db.run('DELETE FROM user_settings WHERE user_id = ?', [userId]);
      
      // Delete the user
      db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
        if (err) {
          console.error('Error deleting user:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
      });
    });
  });
});

// Reports endpoints
app.post('/api/reports', authenticateToken, (req, res) => {
  const { reported_type, reported_id, reason, description } = req.body;
  const reporter_id = req.user.id;
  
  if (!reported_type || !reported_id || !reason) {
    return res.status(400).json({ error: 'Report type, ID, and reason are required' });
  }
  
  if (!['user', 'community', 'post'].includes(reported_type)) {
    return res.status(400).json({ error: 'Invalid report type' });
  }
  
  // Check if user already reported this item
  db.get(
    'SELECT id FROM reports WHERE reporter_id = ? AND reported_type = ? AND reported_id = ?',
    [reporter_id, reported_type, reported_id],
    (err, existingReport) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (existingReport) {
        return res.status(400).json({ error: 'You have already reported this item' });
      }
      
      // Create the report
      db.run(
        'INSERT INTO reports (reporter_id, reported_type, reported_id, reason, description) VALUES (?, ?, ?, ?, ?)',
        [reporter_id, reported_type, reported_id, reason, description || ''],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.status(201).json({ 
            message: 'Report submitted successfully',
            report_id: this.lastID 
          });
        }
      );
    }
  );
});

// Admin: Get all reports
app.get('/api/admin/reports', authenticateToken, requireAdmin, (req, res) => {
  db.all(
    `SELECT r.*, 
            u1.full_name as reporter_name, u1.username as reporter_username,
            u2.full_name as reviewed_by_name, u2.username as reviewed_by_username
     FROM reports r
     LEFT JOIN users u1 ON r.reporter_id = u1.id
     LEFT JOIN users u2 ON r.reviewed_by = u2.id
     ORDER BY r.created_at DESC`,
    (err, reports) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(reports || []);
    }
  );
});

// Admin: Update report status
app.put('/api/admin/reports/:id', authenticateToken, requireAdmin, (req, res) => {
  const reportId = req.params.id;
  const { status } = req.body;
  const reviewerId = req.user.id;
  
  if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  db.run(
    'UPDATE reports SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, reviewerId, reportId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json({ message: 'Report status updated successfully' });
    }
  );
});

// Admin: Get all communities for management
app.get('/api/admin/communities', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  // Check if user is admin
  db.get('SELECT is_admin FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('Error checking admin status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const query = `
      SELECT c.*, u.full_name as creator_name, u.username as creator_username
      FROM communities c
      LEFT JOIN users u ON c.created_by = u.id
      ORDER BY c.created_at DESC
    `;
    
    db.all(query, (err, communities) => {
      if (err) {
        console.error('Error fetching communities:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json(communities);
    });
  });
});

// Admin: Get all posts for management
app.get('/api/admin/posts', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  // Check if user is admin
  db.get('SELECT is_admin FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('Error checking admin status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const query = `
      SELECT p.*, u.full_name as author_name, u.username as author_username,
             c.name as community_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      ORDER BY p.created_at DESC
    `;
    
    db.all(query, (err, posts) => {
      if (err) {
        console.error('Error fetching posts:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json(posts);
    });
  });
});

// Admin: Get all users for management
app.get('/api/admin/users', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  // Check if user is admin
  db.get('SELECT is_admin FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('Error checking admin status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const query = `
      SELECT u.*, p.avatar_url
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ORDER BY u.created_at DESC
    `;
    
    db.all(query, (err, users) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json(users);
    });
  });
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
