#!/usr/bin/env node

// Database Backup Script
// This script creates backups of the database

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database connection
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.log('💡 Please set DATABASE_URL in your .env file or environment variables');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false,
});

// Backup configuration
const config = {
  backupDir: path.join(__dirname, '../backups'),
  maxBackups: 10,
  compressBackups: true
};

// Ensure backup directory exists
const ensureBackupDir = () => {
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
  }
};

// Get all tables
const getTables = async () => {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    return result.rows.map(row => row.table_name);
  } catch (error) {
    console.error('❌ Error getting tables:', error);
    throw error;
  }
};

// Get table schema
const getTableSchema = async (tableName) => {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    return result.rows;
  } catch (error) {
    console.error(`❌ Error getting schema for ${tableName}:`, error);
    throw error;
  }
};

// Get table data
const getTableData = async (tableName) => {
  try {
    const result = await pool.query(`SELECT * FROM ${tableName}`);
    return result.rows;
  } catch (error) {
    console.error(`❌ Error getting data for ${tableName}:`, error);
    throw error;
  }
};

// Generate SQL for table creation
const generateCreateTableSQL = (tableName, schema) => {
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  
  const columns = schema.map(col => {
    let columnDef = `  ${col.column_name} ${col.data_type}`;
    
    if (col.is_nullable === 'NO') {
      columnDef += ' NOT NULL';
    }
    
    if (col.column_default) {
      columnDef += ` DEFAULT ${col.column_default}`;
    }
    
    return columnDef;
  });
  
  sql += columns.join(',\n');
  sql += '\n);\n\n';
  
  return sql;
};

// Generate SQL for data insertion
const generateInsertSQL = (tableName, data) => {
  if (data.length === 0) return '';
  
  const columns = Object.keys(data[0]);
  const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n`;
  
  const values = data.map(row => {
    const rowValues = columns.map(col => {
      const value = row[col];
      if (value === null) return 'NULL';
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
      if (value instanceof Date) return `'${value.toISOString()}'`;
      return value;
    });
    
    return `(${rowValues.join(', ')})`;
  });
  
  return sql + values.join(',\n') + ';\n\n';
};

// Create backup
const createBackup = async () => {
  try {
    console.log('🔄 Creating database backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(config.backupDir, `database-backup-${timestamp}.sql`);
    
    let backupSQL = `-- Database Backup\n`;
    backupSQL += `-- Created: ${new Date().toISOString()}\n`;
    backupSQL += `-- Database: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown'}\n\n`;
    
    // Get all tables
    const tables = await getTables();
    console.log(`📋 Found ${tables.length} tables to backup`);
    
    // Backup each table
    for (const table of tables) {
      console.log(`🔄 Backing up table: ${table}`);
      
      // Get table schema
      const schema = await getTableSchema(table);
      backupSQL += generateCreateTableSQL(table, schema);
      
      // Get table data
      const data = await getTableData(table);
      if (data.length > 0) {
        backupSQL += generateInsertSQL(table, data);
        console.log(`   ✅ ${data.length} rows backed up`);
      } else {
        console.log(`   📝 Table is empty`);
      }
    }
    
    // Write backup file
    fs.writeFileSync(backupFile, backupSQL);
    
    console.log(`✅ Backup created: ${backupFile}`);
    
    // Cleanup old backups
    await cleanupOldBackups();
    
    return backupFile;
    
  } catch (error) {
    console.error('❌ Backup creation failed:', error);
    throw error;
  }
};

// Cleanup old backups
const cleanupOldBackups = async () => {
  try {
    const files = fs.readdirSync(config.backupDir)
      .filter(file => file.startsWith('database-backup-') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(config.backupDir, file),
        stats: fs.statSync(path.join(config.backupDir, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime);
    
    if (files.length > config.maxBackups) {
      const filesToDelete = files.slice(config.maxBackups);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Deleted old backup: ${file.name}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up old backups:', error);
  }
};

// Restore backup
const restoreBackup = async (backupFile) => {
  try {
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    console.log(`🔄 Restoring backup: ${backupFile}`);
    
    const sql = fs.readFileSync(backupFile, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Executing ${statements.length} SQL statements`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await pool.query(statement);
          console.log(`   ✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (error) {
          console.error(`   ❌ Statement ${i + 1} failed:`, error.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('✅ Backup restored successfully');
    
  } catch (error) {
    console.error('❌ Backup restoration failed:', error);
    throw error;
  }
};

// List available backups
const listBackups = () => {
  try {
    const files = fs.readdirSync(config.backupDir)
      .filter(file => file.startsWith('database-backup-') && file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(config.backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: Math.round(stats.size / 1024), // Size in KB
          created: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created);
    
    console.log('📋 Available backups:');
    console.log('====================');
    
    if (files.length === 0) {
      console.log('No backups found');
      return;
    }
    
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   Size: ${file.size} KB`);
      console.log(`   Created: ${file.created.toISOString()}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error listing backups:', error);
  }
};

// Main function
const main = async () => {
  try {
    const command = process.argv[2];
    
    ensureBackupDir();
    
    switch (command) {
      case 'create':
        await createBackup();
        break;
        
      case 'restore':
        const backupFile = process.argv[3];
        if (!backupFile) {
          console.error('❌ Please specify backup file to restore');
          process.exit(1);
        }
        await restoreBackup(backupFile);
        break;
        
      case 'list':
        listBackups();
        break;
        
      default:
        console.log('Usage: node backup-database.js [create|restore|list] [backup-file]');
        console.log('');
        console.log('Commands:');
        console.log('  create                    - Create a new backup');
        console.log('  restore <backup-file>     - Restore from backup');
        console.log('  list                      - List available backups');
        break;
    }
    
  } catch (error) {
    console.error('💥 Backup operation failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { createBackup, restoreBackup, listBackups };
