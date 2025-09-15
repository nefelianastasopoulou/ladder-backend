// Database configuration - Always use PostgreSQL
console.log('Using PostgreSQL for all environments');
const db = require('./database.prod');

module.exports = db;
