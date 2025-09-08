# Database Safety Protocol

## 🚨 NEVER DELETE THE DATABASE AGAIN!

This document outlines the proper procedures for database maintenance to prevent data loss.

## ✅ Safe Database Operations

### 1. Database Migration (RECOMMENDED)
Use the migration system for schema changes:
```bash
node database-migrator.js
```
- ✅ Preserves all existing data
- ✅ Adds missing tables/columns
- ✅ Safe for production use

### 2. Database Backup (ALWAYS DO FIRST)
Before any database operations:
```bash
node backup-database.js
```
- ✅ Creates timestamped backup
- ✅ Keeps last 5 backups automatically
- ✅ Can restore from backup if needed

### 3. Database Restoration (IF NEEDED)
If you must restore from backup:
```bash
# Find the backup file
ls backups/

# Copy backup to main database
cp backups/database-backup-[timestamp].sqlite database.sqlite
```

## ❌ NEVER DO THESE

- ❌ `rm database.sqlite` or `del database.sqlite`
- ❌ Recreating database from scratch
- ❌ Running server without backup first
- ❌ Any operation that deletes user data

## 🔧 Troubleshooting

### If Database Gets Corrupted
1. **STOP** - Don't delete anything
2. Run backup: `node backup-database.js`
3. Try migration: `node database-migrator.js`
4. If still broken, restore from backup

### If Server Won't Start
1. Check if database file exists
2. Try migration system first
3. Only as last resort, restore from backup
4. **NEVER** delete and recreate

## 📋 Emergency Checklist

Before any database operation:
- [ ] Create backup with `node backup-database.js`
- [ ] Verify backup was created successfully
- [ ] Try migration system first
- [ ] Test with existing data
- [ ] Only proceed if all data is preserved

## 🎯 Remember

**Your users' data is precious. Always preserve it.**
