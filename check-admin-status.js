const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Checking admin status of all users...\n');

db.all('SELECT id, email, full_name, is_admin FROM users', (err, rows) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  if (rows.length === 0) {
    console.log('No users found in database.');
  } else {
    console.log('Users in database:');
    rows.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.full_name}, Admin: ${user.is_admin ? 'YES' : 'NO'}`);
    });
  }
  
  db.close();
});
