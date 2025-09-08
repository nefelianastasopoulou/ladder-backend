const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('Database connected successfully');
});

// Make the user with email "@" an admin
db.run('UPDATE users SET is_admin = 1 WHERE email = ?', ['@'], function(err) {
  if (err) {
    console.error('Error updating user:', err);
    return;
  }
  
  if (this.changes === 0) {
    console.log('No user found with email "@"');
    return;
  }
  
  console.log('✅ Successfully made user with email "@" an admin!');
  console.log('You can now log in with email "@" and see the Admin Panel button on your profile page.');
  
  // Also remove admin from the test user
  db.run('UPDATE users SET is_admin = 0 WHERE email = ?', ['test@test.com'], function(err) {
    if (err) {
      console.error('Error removing admin from test user:', err);
    } else {
      console.log('✅ Removed admin privileges from test@test.com');
    }
    db.close();
  });
});
