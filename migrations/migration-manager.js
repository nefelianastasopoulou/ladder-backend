const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class MigrationManager {
  constructor() {
    const isLocal = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('127.0.0.1');
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocal ? false : {
        rejectUnauthorized: false
      }
    });
  }

  async connect() {
    try {
      await this.pool.query('SELECT 1');
      console.log('✅ Database connected for migrations');
    } catch (error) {
      console.error('❌ Error connecting to database:', error);
      throw error;
    }
  }

  async createMigrationsTable() {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          version VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Migrations table ready');
    } catch (error) {
      console.error('❌ Error creating migrations table:', error);
      throw error;
    }
  }

  async getExecutedMigrations() {
    try {
      const result = await this.pool.query('SELECT version FROM migrations ORDER BY version');
      return result.rows.map(row => row.version);
    } catch (error) {
      console.error('❌ Error getting executed migrations:', error);
      throw error;
    }
  }

  async executeMigration(version, name, sql) {
    try {
      console.log(`🔄 Executing migration ${version}: ${name}`);
      
      // Execute the migration SQL
      await this.pool.query(sql);
      
      // Record the migration as executed
      await this.pool.query(
        'INSERT INTO migrations (version, name) VALUES ($1, $2)',
        [version, name]
      );
      
      console.log(`✅ Migration ${version} completed successfully`);
    } catch (error) {
      console.error(`❌ Error executing migration ${version}:`, error);
      throw error;
    }
  }

  async runMigrations() {
    try {
      await this.connect();
      await this.createMigrationsTable();
      
      const executedMigrations = await this.getExecutedMigrations();
      console.log('📋 Executed migrations:', executedMigrations);
      
      // Get all migration files
      const migrationsDir = path.join(__dirname);
      const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      console.log('📁 Found migration files:', files);
      
      for (const file of files) {
        const version = file.split('_')[0];
        const name = file.replace('.sql', '').replace(`${version}_`, '');
        
        if (!executedMigrations.includes(version)) {
          const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          await this.executeMigration(version, name, sql);
        } else {
          console.log(`⏭️  Migration ${version} already executed, skipping`);
        }
      }
      
      console.log('🎉 All migrations completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = MigrationManager;
