const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class MigrationManager {
  constructor() {
    // Configure SSL for Railway or other cloud providers
    const sslConfig = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway') 
      ? { rejectUnauthorized: false }
      : false;
    
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig
    });
    
    // Database connection configured
  }

  async connect() {
    try {
      await this.pool.query('SELECT 1');
      // Database connected successfully
    } catch (error) {
      console.error('❌ Error connecting to database:', error);
      throw error;
    }
  }

  async createMigrationsTable() {
    try {
      // Check if migrations table exists, create if it doesn't
      const tableExists = await this.pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'migrations'
        );
      `);
      
      if (!tableExists.rows[0].exists) {
        await this.pool.query(`
          CREATE TABLE migrations (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Migrations table created');
      } else {
        console.log('✅ Migrations table already exists');
      }
    } catch (error) {
      console.error('❌ Error checking/creating migrations table:', error);
      throw error;
    }
  }

  async getExecutedMigrations() {
    try {
      const result = await this.pool.query('SELECT filename FROM migrations ORDER BY id');
      return result.rows.map(row => row.filename);
    } catch (error) {
      console.error('❌ Error getting executed migrations:', error);
      throw error;
    }
  }

  async executeMigration(filename, sql) {
    try {
      console.log(`🔄 Running migration: ${filename}`);
      
      // Execute the migration SQL
      await this.pool.query(sql);
      
      // Record the migration as executed
      await this.pool.query(
        'INSERT INTO migrations (filename) VALUES ($1)',
        [filename]
      );
      
      console.log(`✅ Migration completed: ${filename}`);
    } catch (error) {
      console.error(`❌ Migration failed: ${filename}`, error);
      throw error;
    }
  }

  async runMigrations() {
    try {
      console.log('🚀 Starting database migrations...');
      
      await this.connect();
      await this.createMigrationsTable();
      
      // Get all migration files
      const migrationsDir = path.join(__dirname);
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Sort to ensure correct order
      
      const executedMigrations = await this.getExecutedMigrations();
      
      // Find pending migrations
      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file)
      );
      
      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations');
        return;
      }
      
      console.log(`📋 Found ${pendingMigrations.length} pending migrations`);
      
      // Execute pending migrations
      for (const migration of pendingMigrations) {
        const sql = fs.readFileSync(path.join(migrationsDir, migration), 'utf8');
        await this.executeMigration(migration, sql);
      }
      
      console.log('🎉 All migrations completed successfully!');
      
    } catch (error) {
      console.error('💥 Migration process failed:', error);
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = MigrationManager;
