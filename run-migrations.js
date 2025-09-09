#!/usr/bin/env node

const MigrationManager = require('./migrations/migration-manager');
require('dotenv').config();

async function main() {
  const migrationManager = new MigrationManager();
  
  try {
    console.log('🚀 Starting database migrations...');
    await migrationManager.runMigrations();
    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await migrationManager.close();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = main;
