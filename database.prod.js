const { Pool } = require('pg');

// Production database configuration (PostgreSQL only)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const db = {
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
      callback(null, { lastID: result.rows[0]?.id, changes: result.rowCount });
    });
  },
  
  close: (callback) => {
    pool.end(callback);
  }
};

console.log('Connected to PostgreSQL database');

module.exports = db;
