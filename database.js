// Database configuration
const isProduction = process.env.NODE_ENV === 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production';

let db;

if (isProduction || isRailway) {
  // Use production database (PostgreSQL only)
  db = require('./database.prod');
} else {
  // Use SQLite for local development (only if available)
  try {
    const sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database('./database.sqlite', (err) => {
      if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
      } else {
        console.log('Connected to SQLite database');
      }
    });
  } catch (error) {
    console.error('SQLite3 not available, falling back to PostgreSQL');
    db = require('./database.prod');
  }
}

module.exports = db;
