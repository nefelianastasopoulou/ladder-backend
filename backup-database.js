const fs = require('fs');
const path = require('path');

function backupDatabase() {
  const dbPath = path.join(__dirname, 'database.sqlite');
  const backupDir = path.join(__dirname, 'backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `database-backup-${timestamp}.sqlite`);

  try {
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Copy database file
    fs.copyFileSync(dbPath, backupPath);
    
    console.log('✅ Database backup created successfully!');
    console.log(`📁 Backup location: ${backupPath}`);
    
    // Keep only the last 5 backups
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('database-backup-') && file.endsWith('.sqlite'))
      .sort()
      .reverse();
    
    if (files.length > 5) {
      const filesToDelete = files.slice(5);
      filesToDelete.forEach(file => {
        fs.unlinkSync(path.join(backupDir, file));
        console.log(`🗑️  Deleted old backup: ${file}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
  }
}

// Export for use in other scripts
module.exports = { backupDatabase };

// If run directly, perform backup
if (require.main === module) {
  backupDatabase();
}
