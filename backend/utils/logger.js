/**
 * Structured Logging Utility
 * Provides consistent logging across the application
 */

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Color codes for console output
const COLORS = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m',  // Yellow
  info: '\x1b[36m',  // Cyan
  debug: '\x1b[90m', // Gray
  reset: '\x1b[0m'   // Reset
};

// Icons for different log levels
const ICONS = {
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  debug: '🐛'
};

class Logger {
  constructor() {
    this.currentLevel = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.info;
  }

  shouldLog(level) {
    return LOG_LEVELS[level] <= this.currentLevel;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const icon = ICONS[level] || '';
    const color = COLORS[level] || '';
    const reset = COLORS.reset;

    if (NODE_ENV === 'development') {
      // Development: Colored console output
      const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
      return `${color}${icon} [${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}${reset}`;
    } else {
      // Production: Structured JSON logging
      return JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        message,
        ...meta
      });
    }
  }

  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta));
    }
  }

  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  // Specialized logging methods
  request(req, res, responseTime) {
    this.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  database(operation, query, duration, error = null) {
    if (error) {
      this.error('Database Error', {
        operation,
        query: query.substring(0, 100) + '...',
        duration: `${duration}ms`,
        error: error.message
      });
    } else {
      this.debug('Database Operation', {
        operation,
        query: query.substring(0, 100) + '...',
        duration: `${duration}ms`
      });
    }
  }

  auth(action, userId, success, error = null) {
    if (error) {
      this.warn('Authentication Failed', {
        action,
        userId,
        error: error.message
      });
    } else {
      this.info('Authentication Success', {
        action,
        userId
      });
    }
  }

  security(event, details = {}) {
    this.warn('Security Event', {
      event,
      ...details
    });
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
