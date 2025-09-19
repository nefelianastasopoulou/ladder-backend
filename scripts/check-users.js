#!/usr/bin/env node

/**
 * Check users in database
 */

// Load environment variables first
require('dotenv').config({ path: 'backend/.env.local' });

const db = require('./backend/database');

async function checkUsers() {
  console.log('👥 Checking users in database...');
  
  try {
    const result = await db.query('SELECT id, email, username, full_name, role, is_active FROM users');
    
    console.log(`Found ${result.rows.length} users:`);
    
    if (result.rows.length === 0) {
      console.log('❌ No users found! You need to create a user account first.');
      console.log('\n💡 To create a user:');
      console.log('   1. Go to your app\'s signup page');
      console.log('   2. Create a new account');
      console.log('   3. Then try logging in with those credentials');
    } else {
      result.rows.forEach((user, index) => {
        console.log(`\n${index + 1}. User:`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Username: ${user.username || 'Not set'}`);
        console.log(`   - Full Name: ${user.full_name || 'Not set'}`);
        console.log(`   - Role: ${user.role || 'user'}`);
        console.log(`   - Active: ${user.is_active ? 'Yes' : 'No'}`);
      });
      
      console.log('\n✅ Try logging in with one of these accounts!');
    }
    
  } catch (error) {
    console.log('❌ Error checking users:', error.message);
  } finally {
    if (db.end) {
      db.end();
    }
  }
}

checkUsers();
