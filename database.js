const { Pool } = require('pg');

// Database configuration
const isProduction = process.env.NODE_ENV === 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production';

let db;

if (isProduction || isRailway) {
  // Use PostgreSQL for production (Railway)
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  db = {
    // Convert PostgreSQL to SQLite-like interface
    get: (query, params, callback) => {
      pool.query(query, params, (err, result) => {
        if (err) return callback(err);
        callback(null, result.rows[0] || null);
      });
    },
    
    all: (query, params, callback) => {
      pool.query(query, params, (err, result) => {
        if (err) return callback(err);
        callback(null, result.rows);
      });
    },
    
    run: (query, params, callback) => {
      pool.query(query, params, (err, result) => {
        if (err) return callback(err);
        callback.call({ lastID: result.insertId, changes: result.rowCount }, err);
      });
    },
    
    close: (callback) => {
      pool.end(callback);
    }
  };
} else {
  // Use SQLite for local development
  const sqlite3 = require('sqlite3').verbose();
  db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
      console.error('Error opening database:', err);
      process.exit(1);
    } else {
      console.log('Connected to SQLite database');
    }
  });
}

module.exports = db;
