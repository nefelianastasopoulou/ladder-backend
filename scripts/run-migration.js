#!/usr/bin/env node

/**
 * Database Migration Runner
 * This script runs a specific migration file
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration(migrationFile) {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log(`🔄 Running migration: ${migrationFile}`);
    
    const migrationPath = path.join(__dirname, '../migrations', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    
    console.log(`✅ Migration completed successfully: ${migrationFile}`);
  } catch (error) {
    console.error(`❌ Migration failed: ${migrationFile}`);
    console.error(error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get migration file from command line arguments
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Please provide a migration file name');
  console.error('Usage: node scripts/run-migration.js <migration-file>');
  console.error('Example: node scripts/run-migration.js 006_fix_email_constraint_and_add_indexes.sql');
  process.exit(1);
}

runMigration(migrationFile);
