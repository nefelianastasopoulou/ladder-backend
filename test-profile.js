const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Testing profile API for admin user...\n');

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
      console.log('This means the profile API will create a new profile with admin status...');
      
      // Simulate what the API does when no profile exists
      console.log('\nSimulated API response would be:');
      console.log({
        user_id: userId,
        full_name: 'N', // From the users table
        email: '@',
        is_admin: true, // This should be true for user ID 2
        bio: null,
        location: null,
        field: null,
        avatar_url: null,
        created_at: new Date().toISOString()
      });
    } else {
      console.log('Profile found:');
      console.log(JSON.stringify(profile, null, 2));
    }
    
    db.close();
  }
);
