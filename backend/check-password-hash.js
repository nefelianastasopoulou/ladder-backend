#!/usr/bin/env node

/**
 * Check password hash in database
 */

require('dotenv').config({ path: '.env.local' });
const db = require('./database');
const bcrypt = require('bcryptjs');

async function checkPasswordHash() {
  console.log('🔍 Checking password hash in database...');
  
  try {
    const result = await db.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1', 
      ['nefelianastasopoulou12@gmail.com']
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ User found:', user.email);
      console.log('Password hash:', user.password_hash);
      console.log('Hash length:', user.password_hash.length);
      console.log('Hash starts with $2a$:', user.password_hash.startsWith('$2a$'));
      console.log('Hash starts with $2b$:', user.password_hash.startsWith('$2b$'));
      
      // Test bcrypt comparison
      console.log('\n🧪 Testing bcrypt comparison...');
      const testPasswords = ['admin123', 'password', 'admin', '123456'];
      
      for (const testPassword of testPasswords) {
        try {
          const isValid = await bcrypt.compare(testPassword, user.password_hash);
          console.log(`Password "${testPassword}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
          if (isValid) {
            console.log('🎉 Found the correct password!');
            break;
          }
        } catch (error) {
          console.log(`Password "${testPassword}": ❌ Error - ${error.message}`);
        }
      }
      
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    if (db.close) {
      db.close();
    }
  }
}

checkPasswordHash();
