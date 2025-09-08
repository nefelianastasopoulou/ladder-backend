const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Adding username field to users table...\n');

// Add username column to users table (without UNIQUE constraint first)
db.run('ALTER TABLE users ADD COLUMN username TEXT', (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('Username column already exists.');
    } else {
      console.error('Error adding username column:', err);
      return;
    }
  } else {
    console.log('Username column added successfully.');
  }
  
  // Update existing users with default usernames
  db.all('SELECT id, email, full_name FROM users', (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      return;
    }
    
    console.log('Updating existing users with usernames...');
    
    users.forEach((user, index) => {
      // Generate username from email or full_name
      let username = '';
      if (user.email === '@') {
        username = 'superadmin';
      } else if (user.email === 'test@test.com') {
        username = 'testuser';
      } else if (user.email === 'user@test.com') {
        username = 'regularuser';
      } else {
        // Generate username from email
        username = user.email.split('@')[0] + (index + 1);
      }
      
      db.run('UPDATE users SET username = ? WHERE id = ?', [username, user.id], (err) => {
        if (err) {
          console.error(`Error updating user ${user.id}:`, err);
        } else {
          console.log(`Updated user ${user.id} (${user.email}) with username: ${username}`);
        }
      });
    });
    
    // Close database after a short delay to allow updates to complete
    setTimeout(() => {
      console.log('\nUsername field setup complete!');
      console.log('Note: Username uniqueness will be enforced by the application logic.');
      db.close();
    }, 1000);
  });
});
