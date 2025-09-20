// Script to run the connections system migration
const fs = require('fs');
const path = require('path');
const db = require('../database');

async function runMigration() {
  try {
    console.log('🔄 Running connections system migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/016_create_connections_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await db.query(migrationSQL);
    
    console.log('✅ Connections system migration completed successfully!');
    console.log('📊 Created user_connections table with indexes and constraints');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    db.end();
  }
}

runMigration();
