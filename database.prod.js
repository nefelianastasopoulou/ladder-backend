const { Pool } = require('pg');
require('dotenv').config();

// Production database configuration (PostgreSQL only)
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log('Connecting to PostgreSQL database...');

// Enhanced connection pool configuration for performance
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX) || 20, // Maximum number of clients in the pool
  min: parseInt(process.env.DB_POOL_MIN) || 2,  // Minimum number of clients in the pool
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: parseInt(process.env.DB_MAX_USES) || 7500, // Close (and replace) a connection after it has been used this many times
  allowExitOnIdle: true, // Allow the pool to close all connections and exit if no connections are in use
};

const pool = new Pool(poolConfig);

// Log pool configuration
console.log(`📊 Database pool configured: max=${poolConfig.max}, min=${poolConfig.min}, idleTimeout=${poolConfig.idleTimeoutMillis}ms`);

// Test the connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
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
      console.log(`📊 Query ${queryType}: ${executionTime}ms`);
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
