const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
  if (err) {
    console.error('Error opening database:', err);
    return;
  }
  console.log('Database connected successfully');
});

// Add is_admin column to users table
db.run('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0', (err) => {
  if (err) {
    console.error('Error adding is_admin column:', err);
    return;
  }
  
  console.log('✅ Successfully added is_admin column to users table');
  
  // Now make the first user admin
  db.get('SELECT id, email, full_name FROM users ORDER BY created_at ASC LIMIT 1', (err, user) => {
    if (err) {
      console.error('Error fetching user:', err);
      return;
    }
    
    if (!user) {
      console.log('No users found in database');
      return;
    }
    
    console.log('Found user:', user);
    
    // Make this user admin
    db.run('UPDATE users SET is_admin = 1 WHERE id = ?', [user.id], function(err) {
      if (err) {
        console.error('Error updating user:', err);
        return;
      }
      
      console.log(`✅ Successfully made user "${user.full_name}" (${user.email}) an admin!`);
      console.log('You can now log in and see the Admin Panel button on your profile page.');
      
      db.close();
    });
  });
});
