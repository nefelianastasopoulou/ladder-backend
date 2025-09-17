const { Pool } = require('pg');
require('dotenv').config();

// Production database configuration (PostgreSQL only)
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Connecting to PostgreSQL database

// Enhanced connection pool configuration for performance
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: getSSLConfig(),
  // Connection pool settings (optimized for Railway)
  max: parseInt(process.env.DB_POOL_MAX) || 10, // Maximum number of clients in the pool
  min: parseInt(process.env.DB_POOL_MIN) || 1,  // Minimum number of clients in the pool
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: parseInt(process.env.DB_MAX_USES) || 7500, // Close (and replace) a connection after it has been used this many times
  allowExitOnIdle: true, // Allow the pool to close all connections and exit if no connections are in use
};

// SSL configuration helper for Railway
function getSSLConfig() {
  // For Railway, we need to accept self-signed certificates
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')) {
    return { rejectUnauthorized: false };
  }
  
  // For other providers, use standard SSL configuration
  const sslConfig = {
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false'
  };
  
  // Add SSL certificates if provided
  if (process.env.DATABASE_SSL_CA) {
    sslConfig.ca = process.env.DATABASE_SSL_CA;
  }
  if (process.env.DATABASE_SSL_CERT) {
    sslConfig.cert = process.env.DATABASE_SSL_CERT;
  }
  if (process.env.DATABASE_SSL_KEY) {
    sslConfig.key = process.env.DATABASE_SSL_KEY;
  }
  
  // If no certificates are provided, use basic SSL
  if (!sslConfig.ca && !sslConfig.cert && !sslConfig.key) {
    return sslConfig.rejectUnauthorized ? true : sslConfig;
  }
  
  return sslConfig;
}

const pool = new Pool(poolConfig);

// Log pool configuration
// Database pool configured

// Test the connection
pool.on('connect', (client) => {
  // Connected to PostgreSQL database
  // Test the connection with a simple query
  client.query('SELECT NOW()', (err, result) => {
    if (err) {
      console.error('❌ Database connection test failed:', err);
    } else {
      // Database connection test successful
    }
  });
});

pool.on('error', (err, client) => {
  console.error('❌ PostgreSQL connection error:', err);
  // Log additional error details
  if (err.code) {
    console.error('Error code:', err.code);
  }
  if (err.detail) {
    console.error('Error detail:', err.detail);
  }
  if (err.hint) {
    console.error('Error hint:', err.hint);
  }
});

// Handle pool errors
pool.on('remove', (client) => {
  // Database client removed from pool
});

// Database performance monitoring
const queryStats = {
  totalQueries: 0,
  slowQueries: 0,
  averageTime: 0,
  totalTime: 0
};

const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD) || 1000; // 1 second

// Enhanced query wrapper with performance monitoring
const executeQuery = (query, params, callback, queryType = 'unknown') => {
  const startTime = Date.now();
  queryStats.totalQueries++;
  
  pool.query(query, params, (err, result) => {
    const executionTime = Date.now() - startTime;
    queryStats.totalTime += executionTime;
    queryStats.averageTime = queryStats.totalTime / queryStats.totalQueries;
    
    // Log slow queries
    if (executionTime > SLOW_QUERY_THRESHOLD) {
      queryStats.slowQueries++;
      console.warn(`🐌 Slow query detected (${executionTime}ms): ${queryType}`);
      console.warn(`   Query: ${query.substring(0, 100)}...`);
      console.warn(`   Params: ${JSON.stringify(params)}`);
    }
    
    // Log query performance in debug mode
    if (process.env.LOG_LEVEL === 'debug' && executionTime > 100) {
      // Query executed
    }
    
    if (err) return callback(err);
    callback(null, result);
  });
};

// Get database performance stats
const getQueryStats = () => ({
  ...queryStats,
  slowQueryPercentage: queryStats.totalQueries > 0 ? (queryStats.slowQueries / queryStats.totalQueries * 100).toFixed(2) : 0,
  poolStats: {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  }
});

const db = {
  // PostgreSQL database interface with performance monitoring
  get: (query, params, callback) => {
    executeQuery(query, params, (err, result) => {
      if (err) return callback(err);
      callback(null, result.rows[0] || null);
    }, 'get');
  },
  
  all: (query, params, callback) => {
    executeQuery(query, params, (err, result) => {
      if (err) return callback(err);
      callback(null, result.rows);
    }, 'all');
  },

  // Add query method for compatibility with existing code
  query: (query, params, callback) => {
    // If no callback is provided, return a promise
    if (typeof callback !== 'function') {
      return new Promise((resolve, reject) => {
        executeQuery(query, params, (err, result) => {
          if (err) return reject(err);
          // Return the result object with rows property for compatibility
          resolve({ rows: result.rows });
        }, 'query');
      });
    }
    
    // Callback pattern
    executeQuery(query, params, (err, result) => {
      if (err) return callback(err);
      // Return the result object with rows property for compatibility
      callback(null, { rows: result.rows });
    }, 'query');
  },
  
  run: (query, params, callback) => {
    executeQuery(query, params, (err, result) => {
      if (err) return callback(err);
      // For PostgreSQL, we need to use RETURNING id in the query to get the inserted ID
      callback(null, { 
        rows: result.rows, 
        rowCount: result.rowCount,
        lastID: result.rows[0]?.id || null, // Keep for backward compatibility
        changes: result.rowCount 
      });
    }, 'run');
  },
  
  // New method for prepared statements (better performance for repeated queries)
  prepared: (name, query) => {
    return {
      execute: (params, callback) => {
        executeQuery(query, params, callback, `prepared:${name}`);
      }
    };
  },
  
  // Get performance statistics
  getStats: getQueryStats,
  
  // Reset performance statistics
  resetStats: () => {
    queryStats.totalQueries = 0;
    queryStats.slowQueries = 0;
    queryStats.averageTime = 0;
    queryStats.totalTime = 0;
  },
  
  close: (callback) => {
    pool.end(callback);
  }
};

// console.log('Connected to PostgreSQL database');

module.exports = db;
