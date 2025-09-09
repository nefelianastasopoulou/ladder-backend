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
      // For PostgreSQL, we need to use RETURNING id in the query to get the inserted ID
      // For now, we'll use a placeholder since most queries don't need the ID
      callback(null, { lastID: result.rows[0]?.id || null, changes: result.rowCount });
    });
  },
  
  close: (callback) => {
    pool.end(callback);
  }
};

console.log('Connected to PostgreSQL database');

module.exports = db;
