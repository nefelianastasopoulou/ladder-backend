// Database configuration - Environment-specific PostgreSQL
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`🔗 Using PostgreSQL for ${NODE_ENV} environment`);

let db;
if (NODE_ENV === 'production') {
  db = require('./database.prod');
} else {
  db = require('./database.dev');
}

module.exports = db;
