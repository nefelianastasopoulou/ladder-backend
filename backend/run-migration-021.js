// Quick script to run migration 021
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Use the Railway DATABASE_URL
const DATABASE_URL = 'postgresql://postgres:orvfIkLKBJJrORtpTvTDTMNdRvdxjEvW@junction.proxy.rlwy.net:55917/railway';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🚀 Running migration 021...');
    
    // Read the migration file
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', '021_add_opportunity_fields.sql'), 'utf8');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('✅ Migration 021 completed successfully!');
    
    // Record the migration
    await pool.query(
      'INSERT INTO migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
      ['021_add_opportunity_fields.sql']
    );
    
    console.log('✅ Migration recorded in migrations table');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();
