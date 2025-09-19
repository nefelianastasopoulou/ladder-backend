#!/usr/bin/env node

/**
 * Create a test user with known credentials
 */

require('dotenv').config({ path: '.env.local' });
const db = require('./database');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  console.log('👤 Creating test user...');
  
  try {
    const email = 'test@example.com';
    const username = 'testuser';
    const fullName = 'Test User';
    const password = 'test123';
    
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('❌ User already exists');
      return;
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const result = await db.query(
      `INSERT INTO users (email, username, full_name, password_hash, role, is_active, created_at)
       VALUES ($1, $2, $3, $4, 'user', true, NOW())
       RETURNING id, email, username, full_name, role`,
      [email, username, fullName, hashedPassword]
    );
    
    const user = result.rows[0];
    
    console.log('✅ Test user created successfully!');
    console.log('Email:', user.email);
    console.log('Username:', user.username);
    console.log('Password: test123');
    console.log('Role:', user.role);
    
  } catch (error) {
    console.log('❌ Error creating user:', error.message);
  } finally {
    if (db.close) {
      db.close();
    }
  }
}

createTestUser();
