const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Updating admin email...\n');

// Update the admin user's email
const newEmail = 'nefelianastasopoulou12@gmail.com';

db.run('UPDATE users SET email = ? WHERE email = ?', [newEmail, '@'], function(err) {
  if (err) {
    console.error('Error updating admin email:', err);
    return;
  }
  
  if (this.changes > 0) {
    console.log(`✅ Admin email updated successfully to: ${newEmail}`);
    console.log(`📝 You can now use this email to log in as admin`);
  } else {
    console.log('❌ No admin user found with email "@"');
  }
  
  // Close database
  db.close();
});
