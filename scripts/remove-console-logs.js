#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to process (excluding the ones we already fixed)
const filesToProcess = [
  'app/signup.tsx',
  'app/login.tsx',
  'app/(tabs)/community.tsx',
  'app/my-opportunities.tsx',
  'app/opportunity-details.tsx',
  'app/conversation.tsx',
  'app/community-settings.tsx',
  'app/context/LanguageContext.tsx',
  'app/admin-panel.tsx',
  'app/applications.tsx',
  'app/edit-profile.tsx',
  'app/(tabs)/profile.tsx',
  'app/community-members.tsx',
  'app/community-detail.tsx',
  'app/settings.tsx',
  'app/onboarding.tsx',
  'app/communities.tsx',
  'app/(tabs)/home.tsx',
  'app/create-community.tsx',
  'app/search.tsx',
  'app/chats.tsx',
  'app/favourites.tsx',
  'app/context/RecommendationsContext.tsx',
  'app/post-opportunity.tsx',
];

function removeConsoleLogs(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove console.log statements (but keep console.error for now)
    content = content.replace(/^\s*console\.log\([^)]*\);\s*$/gm, '');
    content = content.replace(/^\s*console\.warn\([^)]*\);\s*$/gm, '');
    
    // Remove empty lines that might be left behind
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Processed: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Process all files
filesToProcess.forEach(removeConsoleLogs);

console.log('Console log removal completed!');
