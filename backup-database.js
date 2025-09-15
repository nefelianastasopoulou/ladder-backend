#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class DatabaseBackup {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  async backup() {
    try {
      console.log('🔄 Starting database backup...');
      
      // Create backups directory if it doesn't exist
      const backupsDir = path.join(__dirname, 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }
      
      // Generate backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupsDir, `backup-${timestamp}.sql`);
      
      // Get all table names
      const tablesResult = await this.pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      
      const tables = tablesResult.rows.map(row => row.table_name);
      console.log('📋 Found tables:', tables);
      
      let backupContent = `-- Database backup created at ${new Date().toISOString()}\n\n`;
      
      // Backup each table
      for (const table of tables) {
        console.log(`📦 Backing up table: ${table}`);
        
        // Get table structure
        const structureResult = await this.pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        
        backupContent += `-- Table: ${table}\n`;
        backupContent += `CREATE TABLE IF NOT EXISTS ${table} (\n`;
        
        const columns = structureResult.rows.map(col => {
          let def = `  ${col.column_name} ${col.data_type}`;
          if (col.is_nullable === 'NO') def += ' NOT NULL';
          if (col.column_default) def += ` DEFAULT ${col.column_default}`;
          return def;
        });
        
        backupContent += columns.join(',\n') + '\n);\n\n';
        
        // Get table data
        const dataResult = await this.pool.query(`SELECT * FROM ${table}`);
        
        if (dataResult.rows.length > 0) {
          backupContent += `-- Data for table: ${table}\n`;
          
          for (const row of dataResult.rows) {
            const columns = Object.keys(row);
            const values = columns.map(col => {
              const value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              return value;
            });
            
            backupContent += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
          }
          backupContent += '\n';
        }
      }
      
      // Write backup file
      fs.writeFileSync(backupFile, backupContent);
      
      console.log(`✅ Backup completed: ${backupFile}`);
      console.log(`📊 Backup size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);
      
      return backupFile;
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }
}

// Run backup if this file is executed directly
if (require.main === module) {
  const backup = new DatabaseBackup();
  backup.backup()
    .then(() => {
      console.log('🎉 Backup completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Backup failed:', error);
      process.exit(1);
    })
    .finally(() => backup.close());
}

module.exports = DatabaseBackup;