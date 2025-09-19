#!/usr/bin/env node

/**
 * Fix React Native Deprecation Warnings Script
 * This script fixes common deprecation warnings in React Native code
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const APP_DIR = path.join(__dirname, '..', 'app');
const COMPONENTS_DIR = path.join(__dirname, '..', 'components');

// Patterns to fix
const FIXES = [
  // Fix shadow* style props -> boxShadow
  {
    pattern: /shadowColor:\s*['"`]([^'"`]+)['"`],?\s*shadowOffset:\s*{\s*width:\s*([^,]+),\s*height:\s*([^}]+)\s*},\s*shadowOpacity:\s*([^,]+),\s*shadowRadius:\s*([^,}]+)/g,
    replacement: 'boxShadow: \'0 $3px $5px rgba($1, $4)\'',
    description: 'Convert shadow* properties to boxShadow'
  },
  
  // Fix textShadow* style props -> textShadow
  {
    pattern: /textShadowColor:\s*['"`]([^'"`]+)['"`],?\s*textShadowOffset:\s*{\s*width:\s*([^,]+),\s*height:\s*([^}]+)\s*},\s*textShadowRadius:\s*([^,}]+)/g,
    replacement: 'textShadow: \'$2px $3px $4px $1\'',
    description: 'Convert textShadow* properties to textShadow'
  },
  
  // Fix Image style.resizeMode -> props.resizeMode
  {
    pattern: /<Image[^>]*style={[^}]*resizeMode:\s*['"`]([^'"`]+)['"`][^}]*}/g,
    replacement: (match, resizeMode) => {
      return match.replace(/style={[^}]*resizeMode:\s*['"`][^'"`]+['"`][^}]*}/, '')
                 .replace(/<Image/, `<Image resizeMode="${resizeMode}"`);
    },
    description: 'Move resizeMode from style to props'
  },
  
  // Fix props.pointerEvents -> style.pointerEvents
  {
    pattern: /pointerEvents={['"`]([^'"`]+)['"`]}/g,
    replacement: 'style={{ pointerEvents: \'$1\' }}',
    description: 'Move pointerEvents from props to style'
  }
];

// Get all TypeScript/JavaScript files
function getFiles() {
  const patterns = [
    path.join(APP_DIR, '**/*.{ts,tsx,js,jsx}'),
    path.join(COMPONENTS_DIR, '**/*.{ts,tsx,js,jsx}')
  ];
  
  let files = [];
  patterns.forEach(pattern => {
    files = files.concat(glob.sync(pattern));
  });
  
  return files;
}

// Apply fixes to a file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changes = [];
    
    FIXES.forEach(fix => {
      if (typeof fix.replacement === 'function') {
        const matches = content.match(fix.pattern);
        if (matches) {
          content = content.replace(fix.pattern, fix.replacement);
          changes.push(`${fix.description}: ${matches.length} occurrences`);
        }
      } else {
        const matches = content.match(fix.pattern);
        if (matches) {
          content = content.replace(fix.pattern, fix.replacement);
          changes.push(`${fix.description}: ${matches.length} occurrences`);
        }
      }
    });
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return changes;
    }
    
    return null;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return null;
  }
}

// Main function
function main() {
  console.log('🔧 Fixing React Native deprecation warnings...');
  console.log('=' .repeat(50));
  
  const files = getFiles();
  let totalFiles = 0;
  let totalChanges = 0;
  
  files.forEach(file => {
    const changes = fixFile(file);
    if (changes) {
      totalFiles++;
      totalChanges += changes.length;
      console.log(`✅ ${path.relative(process.cwd(), file)}`);
      changes.forEach(change => {
        console.log(`   - ${change}`);
      });
    }
  });
  
  console.log('=' .repeat(50));
  console.log(`✅ Fixed ${totalChanges} deprecation warnings in ${totalFiles} files`);
  
  if (totalFiles === 0) {
    console.log('ℹ️  No deprecation warnings found to fix');
  }
  
  console.log('\n💡 Manual fixes needed:');
  console.log('   1. Check for any remaining shadow* properties in complex styles');
  console.log('   2. Verify Image components have resizeMode as props');
  console.log('   3. Test the app to ensure visual appearance is maintained');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fixFile, getFiles, FIXES };
