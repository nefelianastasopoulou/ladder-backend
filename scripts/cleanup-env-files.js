#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Cleanup script to remove old environment files
 * This helps consolidate to a single .env file approach
 */

const filesToRemove = [
  '.env.development',
  '.env.production', 
  '.env.staging',
  'backend/.env.development',
  'backend/.env.production',
  'backend/.env.staging',
  '.env.production.template',
  'backend/.env.production.template',
  '.env.template',
  'backend/.env.template'
];

const filesToKeep = [
  '.env',
  '.env.example',
  'backend/.env',
  'backend/.env.example',
  'backend/.env.railway'
];

function cleanupEnvironmentFiles() {
  console.log('🧹 Cleaning up old environment files...');
  console.log('=' .repeat(50));

  let removedCount = 0;
  let keptCount = 0;

  filesToRemove.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      try {
        // Create backup before removing
        const backupPath = `${fullPath}.backup.${Date.now()}`;
        fs.copyFileSync(fullPath, backupPath);
        
        fs.unlinkSync(fullPath);
        console.log(`✅ Removed: ${filePath}`);
        console.log(`   💾 Backed up to: ${backupPath}`);
        removedCount++;
      } catch (error) {
        console.error(`❌ Error removing ${filePath}: ${error.message}`);
      }
    } else {
      console.log(`⏭️  Not found: ${filePath}`);
    }
  });

  console.log('\n📁 Checking files to keep...');
  filesToKeep.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      console.log(`✅ Keeping: ${filePath}`);
      keptCount++;
    } else {
      console.log(`⚠️  Missing: ${filePath}`);
    }
  });

  console.log('\n📊 Cleanup Summary:');
  console.log(`   Files removed: ${removedCount}`);
  console.log(`   Files kept: ${keptCount}`);
  
  if (removedCount > 0) {
    console.log('\n💡 Next steps:');
    console.log('1. Run "npm run setup:dev" to create a new .env file');
    console.log('2. Run "npm run validate-env" to validate your configuration');
    console.log('3. Check the backup files if you need to recover any settings');
  }
}

function showHelp() {
  console.log(`
🧹 Environment Files Cleanup Script

This script removes old environment files to consolidate to a single .env approach.

Files that will be removed:
${filesToRemove.map(f => `  - ${f}`).join('\n')}

Files that will be kept:
${filesToKeep.map(f => `  - ${f}`).join('\n')}

Usage:
  node scripts/cleanup-env-files.js

Note: All removed files will be backed up before deletion.
`);
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

if (args.includes('--dry-run')) {
  console.log('🔍 Dry run mode - no files will be removed');
  console.log('Files that would be removed:');
  filesToRemove.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${filePath} (exists)`);
    } else {
      console.log(`  ⏭️  ${filePath} (not found)`);
    }
  });
  process.exit(0);
}

cleanupEnvironmentFiles();
