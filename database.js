// Database configuration
const isProduction = process.env.NODE_ENV === 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production';

let db;

if (isProduction || isRailway) {
  // Use production database (PostgreSQL only)
  db = require('./database.prod');
} else {
  // Use PostgreSQL for all environments (no SQLite3)
  console.log('Using PostgreSQL for development');
  db = require('./database.prod');
}

module.exports = db;
