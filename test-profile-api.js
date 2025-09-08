const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Testing profile API response for admin user...\n');

// Test the exact query that the profile API uses
const userId = 2; // This is the admin user with email "@"

db.get(
  'SELECT p.*, u.email, u.full_name, u.is_admin FROM profiles p JOIN users u ON p.user_id = u.id WHERE p.user_id = ?',
  [userId],
  (err, profile) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    if (!profile) {
      console.log('No profile found for user ID', userId);
    } else {
      console.log('Profile found:');
      console.log(JSON.stringify(profile, null, 2));
      
      // Test the exact response that should be sent
      console.log('\nAPI Response should be:');
      const apiResponse = {
        ...profile,
        is_admin: profile.is_admin
      };
      console.log(JSON.stringify(apiResponse, null, 2));
      console.log('\nIs admin value:', apiResponse.is_admin);
      console.log('Type of is_admin:', typeof apiResponse.is_admin);
    }
    
    db.close();
  }
);
