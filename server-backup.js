const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
// Removed file-type dependency - using multer validation instead

// Load environment variables from the correct path
require('dotenv').config({ 
  path: path.join(__dirname, '.env') 
});

const db = require('./database');

// ==================== ERROR HANDLING SYSTEM ====================

// Custom Error Classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error Response Helper
const sendErrorResponse = (res, statusCode, message, details = null) => {
  const errorResponse = {
    success: false,
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString()
    }
  };
  
  // Add details in development mode only
  if (details && process.env.NODE_ENV === 'development') {
    errorResponse.error.details = details;
  }
  
  res.status(statusCode).json(errorResponse);
};

// Success Response Helper
const sendSuccessResponse = (res, statusCode, data, message = null) => {
  const response = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
  
  if (message) {
    response.message = message;
  }
  
  res.status(statusCode).json(response);
};

// Database Error Handler
const handleDatabaseError = (err, res, operation = 'database operation') => {
  console.error(`Database error during ${operation}:`, err);
  
  if (err.code === '23505') { // Unique constraint violation
    return sendErrorResponse(res, 409, 'Resource already exists');
  } else if (err.code === '23503') { // Foreign key constraint violation
    return sendErrorResponse(res, 400, 'Referenced resource does not exist');
  } else if (err.code === '23502') { // Not null constraint violation
    return sendErrorResponse(res, 400, 'Required field is missing');
  } else {
    return sendErrorResponse(res, 500, 'Database operation failed');
  }
};

// Async Error Wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global Error Handler Middleware
const globalErrorHandler = (err, req, res, next) => {
  console.error('Global error handler:', err);
  
  if (err instanceof AppError) {
    return sendErrorResponse(res, err.statusCode, err.message);
  }
  
  if (err.name === 'ValidationError') {
    return sendErrorResponse(res, 400, 'Validation failed', err.message);
  }
  
  if (err.name === 'JsonWebTokenError') {
    return sendErrorResponse(res, 401, 'Invalid token');
  }
  
  if (err.name === 'TokenExpiredError') {
    return sendErrorResponse(res, 401, 'Token expired');
  }
  
  // Default error
  sendErrorResponse(res, 500, 'Internal server error');
};

// Validation Helper
const validateRequired = (fields, data) => {
  const missing = [];
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missing.push(field);
    }
  }
  return missing;
};

// ==================== INPUT VALIDATION SYSTEM ====================

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Username validation
const isValidUsername = (username) => {
  // Username: 3-20 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Password strength validation
const isValidPassword = (password) => {
  // At least 6 characters, contains at least one letter and one number
  if (password.length < 6) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasLetter && hasNumber;
};

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .trim();
};

// Validate and sanitize user input
const validateUserInput = (req, res, next) => {
  const errors = [];
  
  // Sanitize all string inputs
  for (const key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = sanitizeInput(req.body[key]);
    }
  }
  
  // Validate email if present
  if (req.body.email && !isValidEmail(req.body.email)) {
    errors.push('Invalid email format');
  }
  
  // Validate username if present
  if (req.body.username && !isValidUsername(req.body.username)) {
    errors.push('Username must be 3-20 characters, letters, numbers, and underscores only');
  }
  
  // Validate password if present
  if (req.body.password && !isValidPassword(req.body.password)) {
    errors.push('Password must be at least 6 characters with at least one letter and one number');
  }
  
  if (errors.length > 0) {
    return sendErrorResponse(res, 400, 'Validation failed', errors);
  }
  
  next();
};

// File upload validation
const validateFileUpload = (req, res, next) => {
  if (!req.file) return next();
  
  // Check file size (already handled by multer, but double-check)
  if (req.file.size > 5 * 1024 * 1024) {
    return sendErrorResponse(res, 400, 'File too large. Maximum size is 5MB.');
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return sendErrorResponse(res, 400, 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
  }
  
  next();
};

// SQL injection prevention helper
const escapeSQL = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/'/g, "''"); // Escape single quotes
};

// Content length validation
const validateContentLength = (req, res, next) => {
  const contentLength = parseInt(req.get('Content-Length') || '0');
  const maxLength = 10 * 1024 * 1024; // 10MB max request size
  
  if (contentLength > maxLength) {
    return sendErrorResponse(res, 413, 'Request entity too large');
  }
  
  next();
};

// ==================== ENVIRONMENT VALIDATION ====================

// Validate required environment variables
const requiredEnvVars = {
  JWT_SECRET: process.env.JWT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD
};

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('📝 Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Validate JWT_SECRET strength
if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET must be at least 32 characters long for security!');
  process.exit(1);
}

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// ==================== LOGGING CONFIGURATION ====================

// Simple logging helper
const logger = {
  info: (message, ...args) => {
    if (['development', 'info', 'debug'].includes(LOG_LEVEL)) {
      console.log(`ℹ️  [${new Date().toISOString()}] INFO:`, message, ...args);
    }
  },
  warn: (message, ...args) => {
    if (['development', 'info', 'warn', 'debug'].includes(LOG_LEVEL)) {
      console.warn(`⚠️  [${new Date().toISOString()}] WARN:`, message, ...args);
    }
  },
  error: (message, ...args) => {
    console.error(`❌ [${new Date().toISOString()}] ERROR:`, message, ...args);
  },
  debug: (message, ...args) => {
    if (LOG_LEVEL === 'debug') {
      console.log(`🐛 [${new Date().toISOString()}] DEBUG:`, message, ...args);
    }
  }
};

logger.info(`Starting server in ${NODE_ENV} mode on port ${PORT}`);
logger.info(`Log level set to: ${LOG_LEVEL}`);
if (NODE_ENV === 'development') {
  logger.debug('Development mode - additional debugging enabled');
}

const app = express();

// ==================== RATE LIMITING CONFIGURATION ====================

// Environment-based rate limiting configuration
const rateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (15 * 60 * 1000), // 15 minutes default
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (NODE_ENV === 'production' ? 100 : 1000)
};

logger.info(`Rate limiting: ${rateLimitConfig.maxRequests} requests per ${rateLimitConfig.windowMs / 1000 / 60} minutes`);

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.maxRequests, // Limit each IP to max requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
      status: 429,
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later.',
      status: 429,
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Strict rate limiting for signup endpoint
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 signup attempts per hour
  message: {
    success: false,
    error: {
      message: 'Too many signup attempts, please try again later.',
      status: 429,
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 file uploads per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many file uploads, please try again later.',
      status: 429,
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==================== CORS CONFIGURATION ====================

// CORS configuration for different environments
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Define allowed origins based on environment
    const defaultOrigins = NODE_ENV === 'production' ? [] : [
      'http://localhost:3000',    // React development server
      'http://localhost:19006',   // Expo development server
      'http://localhost:8081',    // Metro bundler
      'exp://localhost:19000',    // Expo development
      'exp://192.168.1.100:19000', // Expo on local network
    ];
    
    // Get production origins from environment variable
    const envOrigins = process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : [];
    
    const allowedOrigins = [...defaultOrigins, ...envOrigins];
    
    // In development, allow localhost with any port
    if (NODE_ENV === 'development') {
      if (origin.match(/^http:\/\/localhost:\d+$/) || 
          origin.match(/^http:\/\/127\.0\.0\.1:\d+$/) ||
          origin.match(/^exp:\/\/.*$/) ||
          origin.match(/^http:\/\/.*\.ngrok\.io$/)) { // Allow ngrok for testing
        return callback(null, true);
      }
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      if (NODE_ENV === 'production') {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        logger.warn(`Add ${origin} to ALLOWED_ORIGINS environment variable if this is intentional`);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-Forwarded-For',
    'X-Real-IP'
  ],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: NODE_ENV === 'production' ? 86400 : 300 // Cache preflight: 24hrs in prod, 5mins in dev
};

// ==================== SECURITY CONFIGURATION ====================

// Trust proxy in production (for accurate IP addresses behind load balancers)
if (NODE_ENV === 'production' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
  logger.info('Trust proxy enabled for production environment');
}

// Security headers middleware
app.use((req, res, next) => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS in production
  if (NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
});

// ==================== MIDDLEWARE SETUP ====================

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(validateContentLength); // Validate request size
app.use(validateUserInput); // Validate and sanitize all user input

// Apply general rate limiting to all routes
app.use('/api', generalLimiter);

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
    db.query(
      'SELECT photo_upload_restriction, allowed_photo_sources FROM user_settings WHERE user_id = $1',
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

// Initialize database using proper migrations
const runMigrations = require('./run-migrations');

const initializeDatabase = async () => {
  try {
    console.log('🔄 Running database migrations...');
    await runMigrations();
    console.log('✅ Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Run the database migrations
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

// Health check endpoint
app.get('/', (req, res) => {
  sendSuccessResponse(res, 200, {
    status: 'OK',
    message: 'Ladder Backend API is running',
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  sendSuccessResponse(res, 200, {
    status: 'OK',
    message: 'Health check passed'
  });
});

// Enhanced health check with system information
app.get('/health/detailed', async (req, res) => {
  try {
    const healthInfo = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: NODE_ENV,
      version: '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB'
      },
      database: 'unknown'
    };

    // Test database connection
    try {
      await new Promise((resolve, reject) => {
        db.query('SELECT 1 as test', [], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      healthInfo.database = 'connected';
    } catch (dbError) {
      healthInfo.database = 'disconnected';
      healthInfo.status = 'DEGRADED';
      logger.warn('Database health check failed:', dbError.message);
    }

    const statusCode = healthInfo.status === 'OK' ? 200 : 503;
    sendSuccessResponse(res, statusCode, healthInfo);
  } catch (error) {
    logger.error('Health check error:', error);
    sendErrorResponse(res, 500, 'Health check failed');
  }
});

// Readiness check for load balancers
app.get('/health/ready', (req, res) => {
  // Simple check - if server is running, it's ready
  sendSuccessResponse(res, 200, {
    status: 'READY',
    message: 'Service is ready to accept requests'
  });
});

// Liveness check for container orchestration
app.get('/health/live', (req, res) => {
  // Simple check - if server is running, it's alive
  sendSuccessResponse(res, 200, {
    status: 'ALIVE',
    message: 'Service is alive'
  });
});

// Database performance monitoring endpoint (admin only)
app.get('/health/database', authenticateToken, requireAdmin, (req, res) => {
  try {
    const dbStats = db.getStats();
    sendSuccessResponse(res, 200, {
      status: 'OK',
      database: {
        performance: {
          totalQueries: dbStats.totalQueries,
          slowQueries: dbStats.slowQueries,
          slowQueryPercentage: dbStats.slowQueryPercentage + '%',
          averageQueryTime: Math.round(dbStats.averageTime) + 'ms',
          totalQueryTime: dbStats.totalTime + 'ms'
        },
        connectionPool: {
          totalConnections: dbStats.poolStats.totalCount,
          idleConnections: dbStats.poolStats.idleCount,
          waitingClients: dbStats.poolStats.waitingCount,
          utilizationPercentage: dbStats.poolStats.totalCount > 0 ? 
            Math.round((dbStats.poolStats.totalCount - dbStats.poolStats.idleCount) / dbStats.poolStats.totalCount * 100) + '%' : '0%'
        }
      }
    });
  } catch (error) {
    logger.error('Database health check error:', error);
    sendErrorResponse(res, 500, 'Database health check failed');
  }
});

// Reset database performance statistics (admin only)
app.post('/health/database/reset', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.resetStats();
    sendSuccessResponse(res, 200, {
      message: 'Database performance statistics reset successfully'
    });
  } catch (error) {
    logger.error('Database stats reset error:', error);
    sendErrorResponse(res, 500, 'Failed to reset database statistics');
  }
});

// Routes
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  db.query(
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
  
  db.query(
    `SELECT id, email, full_name, username, is_admin, created_at 
     FROM users 
     WHERE full_name LIKE $1 OR username LIKE $2
     ORDER BY 
       CASE 
         WHEN full_name LIKE $3 THEN 1
         WHEN username LIKE $4 THEN 2
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
  
  db.query(
    `SELECT p.id, p.title, p.content, p.category, p.likes_count, p.comments_count, p.created_at,
            u.full_name as author_name, u.username as author_username,
            c.name as community_name
     FROM posts p
     LEFT JOIN users u ON p.author_id = u.id
     LEFT JOIN communities c ON p.community_id = c.id
     WHERE p.is_published = 1 AND (p.title LIKE $1 OR p.content LIKE $2)
     ORDER BY 
       CASE 
         WHEN p.title LIKE $3 THEN 1
         WHEN p.content LIKE $4 THEN 2
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
  
  db.query(
    `SELECT c.id, c.name, c.description, c.category, c.member_count, c.is_public, c.created_at,
            u.full_name as creator_name, u.username as creator_username
     FROM communities c
     LEFT JOIN users u ON c.created_by = u.id
     WHERE c.is_public = 1 AND (c.name LIKE $1 OR c.description LIKE $2)
     ORDER BY 
       CASE 
         WHEN c.name LIKE $3 THEN 1
         WHEN c.description LIKE $4 THEN 2
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
  db.query(
    `SELECT id, email, full_name, username, is_admin, created_at, 'user' as type
     FROM users 
     WHERE full_name LIKE $1 OR username LIKE $2
     ORDER BY 
       CASE 
         WHEN full_name LIKE $1 THEN 1
         WHEN username LIKE $2 THEN 2
         ELSE 3
       END
     LIMIT 10`,
    [searchTerm, searchTerm, searchTerm, searchTerm],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Search posts
      db.query(
        `SELECT p.id, p.title, p.content, p.category, p.likes_count, p.comments_count, p.created_at,
                u.full_name as author_name, u.username as author_username,
                c.name as community_name, 'post' as type
         FROM posts p
         LEFT JOIN users u ON p.author_id = u.id
         LEFT JOIN communities c ON p.community_id = c.id
         WHERE p.is_published = 1 AND (p.title LIKE $1 OR p.content LIKE $2)
         ORDER BY 
           CASE 
             WHEN p.title LIKE $1 THEN 1
             WHEN p.content LIKE $2 THEN 2
             ELSE 3
           END
         LIMIT 10`,
        [searchTerm, searchTerm, searchTerm, searchTerm],
        (err, posts) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          // Search communities
          db.query(
            `SELECT c.id, c.name, c.description, c.category, c.member_count, c.is_public, c.created_at,
                    u.full_name as creator_name, u.username as creator_username, 'community' as type
             FROM communities c
             LEFT JOIN users u ON c.created_by = u.id
             WHERE c.is_public = 1 AND (c.name LIKE $1 OR c.description LIKE $2)
             ORDER BY 
               CASE 
                 WHEN c.name LIKE $1 THEN 1
                 WHEN c.description LIKE $2 THEN 2
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
app.post('/api/auth/signup', signupLimiter, asyncHandler(async (req, res) => {
  const { email, password, full_name, username } = req.body;

  // Validate required fields
  const missingFields = validateRequired(['email', 'password', 'full_name', 'username'], req.body);
  if (missingFields.length > 0) {
    return sendErrorResponse(res, 400, `Missing required fields: ${missingFields.join(', ')}`);
  }

  // Additional validation for signup
  if (full_name.length < 2 || full_name.length > 100) {
    return sendErrorResponse(res, 400, 'Full name must be between 2 and 100 characters');
  }

  // Check if username already exists (email can be duplicate now)
  db.query('SELECT id FROM users WHERE username = $1', [username], async (err, row) => {
    if (err) {
      return handleDatabaseError(err, res, 'username check');
    }
    if (row) {
      return sendErrorResponse(res, 409, 'Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Insert user
    db.query(
      'INSERT INTO users (email, password, full_name, username, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [email, hashedPassword, full_name, username, 0],
      function(err, result) {
        if (err) {
          return handleDatabaseError(err, res, 'user creation');
        }

        const userId = result.rows[0].id;

        // Generate JWT token
        const token = jwt.sign(
          { id: userId, email, username, is_admin: false },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        sendSuccessResponse(res, 201, {
          token,
          user: { id: userId, email, username, full_name, is_admin: false }
        }, 'User created successfully');
      }
    );
  });
}));

// Login endpoint
app.post('/api/auth/signin', authLimiter, asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!password || (!email && !username)) {
    return sendErrorResponse(res, 400, 'Email/username and password are required');
  }

  // Determine if login is by email or username
  // Since emails can now be duplicate, we need to handle this differently
  let query, queryParam;
  
  if (email && email.includes('@')) {
    // If email is provided, we need to get all users with that email
    // and let the user choose or use the first one
    query = 'SELECT id, email, password, full_name, username, is_admin FROM users WHERE email = $1 LIMIT 1';
    queryParam = email;
  } else {
    // Username login (preferred since usernames are unique)
    query = 'SELECT id, email, password, full_name, username, is_admin FROM users WHERE username = $1';
    queryParam = username;
  }

  db.query(query, [queryParam], async (err, result) => {
    if (err) {
      return handleDatabaseError(err, res, 'user lookup');
    }
    const user = result.rows[0];
    if (!user) {
      return sendErrorResponse(res, 401, 'Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return sendErrorResponse(res, 401, 'Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    sendSuccessResponse(res, 200, {
      token,
      user: { id: user.id, email: user.email, username: user.username, full_name: user.full_name, is_admin: user.is_admin }
    }, 'Login successful');
  });
}));

// Make user admin (admin only)
app.post('/api/auth/make-admin', authenticateToken, requireAdmin, (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  db.query(
    'UPDATE users SET is_admin = 1 WHERE id = $1',
    [user_id],
        function(err, result) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (result.rowCount === 0) {
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

  db.query(
    'DELETE FROM users WHERE id = $1',
    [userId],
    function(err, result) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    }
  );
});

// Profile endpoint
app.get('/api/profile', authenticateToken, (req, res) => {
  db.query(
    'SELECT id, email, full_name, username, is_admin, created_at FROM users WHERE id = $1',
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
    db.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, req.user.id], (err, row) => {
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
      updateFields.push('full_name = $' + (values.length + 1));
      values.push(full_name);
    }
    if (username !== undefined) {
      updateFields.push('username = $' + (values.length + 1));
      values.push(username);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(req.user.id);
    
    db.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${values.length}`,
      values,
      function(err, result) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Update profile table if it exists
        db.query(
          `INSERT INTO user_profiles (user_id, bio, location, field, avatar_url)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id) DO NOTHING`,
          [req.user.id, bio || '', location || '', field || '', avatar_url || ''],
          (err) => {
            if (err) {
              console.error('Error inserting profile:', err);
            }
            
            // Update existing profile
            db.query(
              `UPDATE user_profiles SET 
                bio = COALESCE($1, bio),
                location = COALESCE($2, location),
                field = COALESCE($3, field),
                avatar_url = COALESCE($4, avatar_url)
              WHERE user_id = $5`,
              [bio, location, field, avatar_url, req.user.id],
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
    );
  }
});

// Onboarding endpoint
app.post('/api/onboarding', authenticateToken, (req, res) => {
  const { 
    age_range, 
    field_of_study, 
    academic_level, 
    university, 
    preferences 
  } = req.body;
  
  // Validate required fields
  if (!age_range || !field_of_study || !academic_level) {
    return res.status(400).json({ 
      error: 'Missing required onboarding fields' 
    });
  }
  
  // Insert or update user profile with onboarding data
  db.query(
    `INSERT INTO user_profiles (
      user_id, age_range, field_of_study, academic_level, university, 
      preferences, onboarding_completed, onboarding_completed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (user_id) DO UPDATE SET
      age_range = EXCLUDED.age_range,
      field_of_study = EXCLUDED.field_of_study,
      academic_level = EXCLUDED.academic_level,
      university = EXCLUDED.university,
      preferences = EXCLUDED.preferences,
      onboarding_completed = EXCLUDED.onboarding_completed,
      onboarding_completed_at = EXCLUDED.onboarding_completed_at`,
    [
      req.user.id,
      age_range,
      JSON.stringify(field_of_study), // Store as JSON string
      academic_level,
      university || '',
      JSON.stringify(preferences || []), // Store as JSON string
      1, // onboarding_completed = true
      new Date().toISOString()
    ],
    function(err, result) {
      if (err) {
        console.error('Error saving onboarding data:', err);
        return res.status(500).json({ error: 'Failed to save onboarding data' });
      }
      
      res.json({ 
        message: 'Onboarding data saved successfully',
        onboarding_completed: true
      });
    }
  );
});

// Settings endpoints
app.get('/api/settings', authenticateToken, (req, res) => {
  db.query(
    'SELECT * FROM user_settings WHERE user_id = $1',
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
  
  db.query(
    `INSERT INTO user_settings (
      user_id, email_notifications, push_notifications, sound_vibration, 
      location_services, language, show_activity_status, show_last_seen,
      allow_direct_messages, allow_connection_requests, community_posts_visibility,
      photo_upload_restriction, allowed_photo_sources
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (user_id) DO UPDATE SET
      email_notifications = EXCLUDED.email_notifications,
      push_notifications = EXCLUDED.push_notifications,
      sound_vibration = EXCLUDED.sound_vibration,
      location_services = EXCLUDED.location_services,
      language = EXCLUDED.language,
      show_activity_status = EXCLUDED.show_activity_status,
      show_last_seen = EXCLUDED.show_last_seen,
      allow_direct_messages = EXCLUDED.allow_direct_messages,
      allow_connection_requests = EXCLUDED.allow_connection_requests,
      community_posts_visibility = EXCLUDED.community_posts_visibility,
      photo_upload_restriction = EXCLUDED.photo_upload_restriction,
      allowed_photo_sources = EXCLUDED.allowed_photo_sources`,
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
    function(err, result) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Settings updated successfully' });
    }
  );
});

// Opportunities endpoints
app.get('/api/opportunities', (req, res) => {
  db.query(
    'SELECT * FROM opportunities ORDER BY created_at DESC',
    [],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(result.rows || []);
    }
  );
});

app.get('/api/opportunities/my', authenticateToken, (req, res) => {
  db.query(
    'SELECT * FROM opportunities WHERE created_by = $1 ORDER BY created_at DESC',
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
  db.query(
    `SELECT a.*, o.title, o.description, o.category, o.location 
     FROM applications a 
     JOIN opportunities o ON a.opportunity_id = o.id 
     WHERE a.user_id = $1 
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
  db.query(
    `SELECT o.* FROM opportunities o 
     JOIN favorites f ON o.id = f.opportunity_id 
     WHERE f.user_id = $1 
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
  
  db.query(
    `SELECT c.*, u.full_name as creator_name, u.username as creator_username,
            CASE WHEN cm.user_id IS NOT NULL THEN 1 ELSE 0 END as is_member
     FROM communities c
     LEFT JOIN users u ON c.created_by = u.id
     LEFT JOIN community_members cm ON c.id = cm.community_id AND cm.user_id = $1
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
  
  db.query(
    `SELECT p.id, p.title, p.content, p.likes_count, p.comments_count, p.created_at,
            u.full_name as author_name, u.username as author_username
     FROM posts p
     LEFT JOIN users u ON p.author_id = u.id
     WHERE p.community_id = $1
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
app.post('/api/communities/:id/posts', authenticateToken, uploadLimiter, checkPhotoUploadRestrictions, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendErrorResponse(res, 400, 'File too large. Maximum size is 5MB.');
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return sendErrorResponse(res, 400, 'Too many files. Only 1 file allowed.');
      }
      return sendErrorResponse(res, 400, err.message);
    }
    next();
  });
}, validateImageFile, validateFileUpload, (req, res) => {
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
  db.query(
    'SELECT id FROM community_members WHERE community_id = $1 AND user_id = $2',
    [communityId, userId],
    (err, membership) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!membership) {
        return res.status(403).json({ error: 'You must be a member of this community to post' });
      }
      
      // Create the post
      db.query(
        'INSERT INTO posts (title, content, author_id, community_id, image_url, likes_count, comments_count, created_at) VALUES ($1, $2, $3, $4, $5, 0, 0, CURRENT_TIMESTAMP) RETURNING id',
        [title, content, userId, communityId, imageUrl],
        function(err, result) {
          if (err) {
            console.error('Error creating post:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          // Update community post count
          db.query(
            'UPDATE communities SET post_count = post_count + 1 WHERE id = $1',
            [communityId],
            (err) => {
              if (err) {
                console.error('Error updating community post count:', err);
              }
            }
          );
          
          res.status(201).json({
            message: 'Post created successfully',
            post_id: result.rows[0].id
          });
        }
      );
    }
  );
});

// Create a platform-wide post (not in a specific community)
app.post('/api/posts', authenticateToken, uploadLimiter, checkPhotoUploadRestrictions, (req, res, next) => {
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
  db.query(
    'INSERT INTO posts (title, content, author_id, community_id, image_url, likes_count, comments_count, created_at) VALUES ($1, $2, $3, NULL, $4, 0, 0, CURRENT_TIMESTAMP) RETURNING id',
    [title, content, userId, imageUrl],
    function(err, result) {
      if (err) {
        console.error('Error creating platform post:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({
        message: 'Post created successfully',
        post_id: result.rows[0].id
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
  db.query('SELECT created_by FROM communities WHERE id = $1', [communityId], (err, community) => {
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
      db.query('SELECT id FROM communities WHERE name = $1 AND id != $2', [name, communityId], (err, existingCommunity) => {
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
        updateFields.push('name = $' + (values.length + 1));
        values.push(name);
      }
      if (description !== undefined) {
        updateFields.push('description = $' + (values.length + 1));
        values.push(description);
      }
      if (is_public !== undefined) {
        updateFields.push('is_public = $' + (values.length + 1));
        values.push(is_public ? 1 : 0);
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      
      values.push(communityId);
      
      db.query(
        `UPDATE communities SET ${updateFields.join(', ')} WHERE id = $${values.length}`,
        values,
        function(err, result) {
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
  db.query('SELECT id FROM communities WHERE name = $1', [name], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (row) {
      return res.status(400).json({ error: 'Community name already exists' });
    }
    
    // Create community
    db.query(
      'INSERT INTO communities (name, description, category, created_by, member_count, is_public) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [name, description, category || '', req.user.id, 1, 1],
      function(err, result) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Add creator as first member
        const communityId = result.rows[0].id;
        db.query(
          'INSERT INTO community_members (user_id, community_id, role) VALUES ($1, $2, $3)',
          [req.user.id, communityId, 'admin'],
          (err) => {
            if (err) {
              console.error('Error adding creator as member:', err);
            }
          }
        );
        
        res.status(201).json({
          message: 'Community created successfully',
          community: {
            id: communityId,
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
  db.query('SELECT * FROM communities WHERE id = $1', [communityId], (err, community) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Check if user is already a member
    db.query('SELECT * FROM community_members WHERE user_id = $1 AND community_id = $2', [userId, communityId], (err, existingMember) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (existingMember) {
        return res.status(400).json({ error: 'You are already a member of this community' });
      }

      // Add user to community
      db.query(
        'INSERT INTO community_members (user_id, community_id, role) VALUES ($1, $2, $3)',
        [userId, communityId, 'member'],
        function(err, result) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Update member count
          db.query(
            'UPDATE communities SET member_count = member_count + 1 WHERE id = $1',
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
  db.query('SELECT * FROM community_members WHERE user_id = $1 AND community_id = $2', [userId, communityId], (err, member) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!member) {
      return res.status(400).json({ error: 'You are not a member of this community' });
    }

    // Remove user from community
    db.query(
      'DELETE FROM community_members WHERE user_id = $1 AND community_id = $2',
      [userId, communityId],
      function(err, result) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // Update member count
        db.query(
          'UPDATE communities SET member_count = member_count - 1 WHERE id = $1',
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
  
  // Optimized conversation query with better performance
  const query = `
    WITH conversation_data AS (
      SELECT DISTINCT c.*, 
             u.full_name as other_user_name,
             u.username as other_user_username,
             p.avatar_url as other_user_avatar
      FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
      JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
      JOIN users u ON cp2.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE cp1.user_id = $1 
      AND cp2.user_id != $2
    ),
    latest_messages AS (
      SELECT 
        conversation_id,
        content as last_message,
        created_at as last_message_time,
        sender_id as last_message_sender_id,
        ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY created_at DESC) as rn
      FROM messages
      WHERE conversation_id IN (SELECT id FROM conversation_data)
    ),
    unread_counts AS (
      SELECT 
        conversation_id,
        COUNT(*) as unread_count
      FROM messages
      WHERE conversation_id IN (SELECT id FROM conversation_data)
      AND is_read = 0 
      AND sender_id != $1
      GROUP BY conversation_id
    )
    SELECT 
      cd.*,
      lm.last_message,
      lm.last_message_time,
      lm.last_message_sender_id,
      COALESCE(uc.unread_count, 0) as unread_count
    FROM conversation_data cd
    LEFT JOIN latest_messages lm ON cd.id = lm.conversation_id AND lm.rn = 1
    LEFT JOIN unread_counts uc ON cd.id = uc.conversation_id
    ORDER BY COALESCE(lm.last_message_time, cd.updated_at) DESC
  `;
  
  db.query(query, [userId, userId, userId], (err, rows) => {
    if (err) {
      console.error('Error fetching conversations:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Optimized response mapping - removed nested query
    const conversations = rows.map(row => ({
      id: row.id,
      type: row.type,
      name: row.name || row.other_user_name,
      other_user: {
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
    AND cp1.user_id = $1 AND cp2.user_id = $2
  `;
  
  db.query(checkQuery, [userId, other_user_id], (err, existing) => {
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
    db.query(
      'INSERT INTO conversations (type, created_by) VALUES ($1, $2) RETURNING id',
      ['individual', userId],
      function(err, result) {
        if (err) {
          console.error('Error creating conversation:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        const conversationId = result.rows[0].id;
        
        // Add participants
        db.query(
          'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)',
          [conversationId, userId],
          (err) => {
            if (err) {
              console.error('Error adding participant 1:', err);
              return res.status(500).json({ error: 'Database error' });
            }
          }
        );
        
        db.query(
          'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)',
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
  db.query(
    'SELECT id FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
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
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC
      `;
      
      db.query(query, [conversationId], (err, messages) => {
        if (err) {
          console.error('Error fetching messages:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Mark messages as read
        db.query(
          'UPDATE messages SET is_read = 1 WHERE conversation_id = $1 AND sender_id != $2',
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
  db.query(
    'SELECT id FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
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
      db.query(
        'INSERT INTO messages (conversation_id, sender_id, content, message_type) VALUES ($1, $2, $3, $4) RETURNING id',
        [conversationId, userId, content.trim(), message_type],
        function(err, result) {
          if (err) {
            console.error('Error sending message:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          // Update conversation timestamp
          db.query(
            'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [conversationId],
            (err) => {
              if (err) {
                console.error('Error updating conversation timestamp:', err);
              }
            }
          );
          
          res.status(201).json({
            message_id: result.rows[0].id,
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
  db.query('SELECT is_admin FROM users WHERE id = $1', [userId], (err, user) => {
    if (err) {
      console.error('Error checking admin status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Delete community and related data
    // Delete messages in community posts
      const communityPattern = `%Community ${communityId}%`;
      db.query('DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE type = $1 AND name LIKE $2)', ['community', communityPattern]);
      
      // Delete community members
      db.query('DELETE FROM community_members WHERE community_id = $1', [communityId]);
      
      // Delete posts in community
      db.query('DELETE FROM posts WHERE community_id = $1', [communityId]);
      
      // Delete the community
      db.query('DELETE FROM communities WHERE id = $1', [communityId], function(err, result) {
        if (err) {
          console.error('Error deleting community:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Community not found' });
        }
        
        res.json({ message: 'Community deleted successfully' });
      });
    });
  });

// Admin: Delete a post
app.delete('/api/admin/posts/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const postId = req.params.id;
  
  // Check if user is admin
  db.query('SELECT is_admin FROM users WHERE id = $1', [userId], (err, user) => {
    if (err) {
      console.error('Error checking admin status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Delete the post
    db.query('DELETE FROM posts WHERE id = $1', [postId], function(err, result) {
      if (err) {
        console.error('Error deleting post:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.rowCount === 0) {
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
  db.query('SELECT is_admin FROM users WHERE id = $1', [adminId], (err, admin) => {
    if (err) {
      console.error('Error checking admin status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!admin || !admin.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Delete user and related data
    // Delete user's messages
      db.query('DELETE FROM messages WHERE sender_id = $1', [userId]);
      
      // Delete user's posts
      db.query('DELETE FROM posts WHERE author_id = $1', [userId]);
      
      // Delete user's communities
      db.query('DELETE FROM communities WHERE created_by = $1', [userId]);
      
      // Delete community memberships
      db.query('DELETE FROM community_members WHERE user_id = $1', [userId]);
      
      // Delete conversation participations
      db.query('DELETE FROM conversation_participants WHERE user_id = $1', [userId]);
      
      // Delete user's applications
      db.query('DELETE FROM applications WHERE user_id = $1', [userId]);
      
      // Delete user's favorites
      db.query('DELETE FROM favorites WHERE user_id = $1', [userId]);
      
      // Delete user's opportunities
      db.query('DELETE FROM opportunities WHERE created_by = $1', [userId]);
      
      // Delete user's profile
      db.query('DELETE FROM profiles WHERE user_id = $1', [userId]);
      
      // Delete user's settings
      db.query('DELETE FROM user_settings WHERE user_id = $1', [userId]);
      
      // Delete the user
      db.query('DELETE FROM users WHERE id = $1', [userId], function(err, result) {
        if (err) {
          console.error('Error deleting user:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
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
  db.query(
    'SELECT id FROM reports WHERE reporter_id = $1 AND reported_type = $2 AND reported_id = $3',
    [reporter_id, reported_type, reported_id],
    (err, existingReport) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (existingReport) {
        return res.status(400).json({ error: 'You have already reported this item' });
      }
      
      // Create the report
      db.query(
        'INSERT INTO reports (reporter_id, reported_type, reported_id, reason, description) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [reporter_id, reported_type, reported_id, reason, description || ''],
        function(err, result) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.status(201).json({ 
            message: 'Report submitted successfully',
            report_id: result.rows[0].id 
          });
        }
      );
    }
  );
});

// Admin: Get all reports
app.get('/api/admin/reports', authenticateToken, requireAdmin, (req, res) => {
  db.query(
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
  
  db.query(
    'UPDATE reports SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP WHERE id = $3',
    [status, reviewerId, reportId],
    function(err, result) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.rowCount === 0) {
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
  db.query('SELECT is_admin FROM users WHERE id = $1', [userId], (err, user) => {
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
    
    db.query(query, (err, communities) => {
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
  db.query('SELECT is_admin FROM users WHERE id = $1', [userId], (err, user) => {
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
    
    db.query(query, (err, posts) => {
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
  db.query('SELECT is_admin FROM users WHERE id = $1', [userId], (err, user) => {
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
    
    db.query(query, (err, users) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json(users);
    });
  });
});

// Admin setup endpoint (temporary)
app.post('/admin/setup', rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1, // Only allow 1 admin setup per hour
  message: {
    success: false,
    error: {
      message: 'Admin setup can only be performed once per hour.',
      status: 429,
      timestamp: new Date().toISOString()
    }
  }
}), async (req, res) => {
  try {
    
    // Delete all existing users
    db.query('DELETE FROM users', [], (err) => {
      if (err) {
        console.error('Error deleting users:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Create new admin user with new password
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminEmail || !adminPassword) {
        return res.status(500).json({ error: 'Admin credentials not configured in environment variables' });
      }
      
      bcrypt.hash(adminPassword, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Error hashing password:', err);
          return res.status(500).json({ error: 'Server error' });
        }
        
        db.query(
          'INSERT INTO users (email, password, full_name, username, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [adminEmail, hashedPassword, 'Admin User', adminUsername, 1],
          function(err, result) {
            if (err) {
              console.error('Error creating admin user:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ 
              message: 'Admin user created successfully',
              credentials: {
                email: adminEmail,
                username: adminUsername,
                password: adminPassword
              }
            });
          }
        );
      });
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
logger.info(`About to start server on port: ${PORT}`);

const server = app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    logger.error('Server startup error:', err);
    return;
  }
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API available at: http://localhost:${PORT}`);
  logger.info(`Environment: ${NODE_ENV}`);
  if (NODE_ENV === 'production') {
    logger.info('Production security features enabled');
  }
});

// Global error handler (must be last middleware)
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated gracefully');
    // db.close();
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated gracefully');
    // db.close();
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
