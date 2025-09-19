// Middleware setup and configuration
// const cors = require('cors'); // Unused import
const rateLimit = require('express-rate-limit');
const config = require('../config/environment');

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Expo Go, or curl requests)
    if (!origin) {
      console.log('🌐 CORS: Allowing request with no origin (mobile app)');
      return callback(null, true);
    }
    
    // Handle wildcard for development
    if (config.ALLOWED_ORIGINS === '*' || config.ALLOWED_ORIGINS.includes('*')) {
      console.log('🌐 CORS: Allowing all origins (wildcard)');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    const allowedOrigins = Array.isArray(config.ALLOWED_ORIGINS) 
      ? config.ALLOWED_ORIGINS 
      : config.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    
    // Check for exact match first
    if (allowedOrigins.includes(origin)) {
      console.log(`🌐 CORS: Allowing origin: ${origin}`);
      return callback(null, true);
    }
    
    // Check for localhost with any port (for development)
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      console.log(`🌐 CORS: Allowing localhost origin: ${origin}`);
      return callback(null, true);
    }
    
    // Check for Expo Go development URLs
    if (origin.startsWith('exp://') && (origin.includes('localhost') || origin.includes('192.168.'))) {
      console.log(`🌐 CORS: Allowing Expo Go origin: ${origin}`);
      return callback(null, true);
    }
    
    console.log(`🚫 CORS: Blocking origin: ${origin}`);
    console.log(`📋 Allowed origins: ${allowedOrigins.join(', ')}`);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Rate limiting configuration
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// General rate limiting
const generalRateLimit = createRateLimit(
  config.RATE_LIMIT_WINDOW_MS,
  config.RATE_LIMIT_MAX_REQUESTS,
  'Too many requests from this IP, please try again later.'
);

// Auth rate limiting (stricter)
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later.'
);

// File upload rate limiting
const uploadRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads per hour
  'Too many file uploads, please try again later.'
);

module.exports = {
  corsOptions,
  generalRateLimit,
  authRateLimit,
  uploadRateLimit
};
