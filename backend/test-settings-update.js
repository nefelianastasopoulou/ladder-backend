const db = require('./database');

console.log('🧪 Testing settings update...');

// Test updating language for user ID 3 (your user)
const testUpdate = () => {
  const query = `
    UPDATE user_settings 
    SET language = $1
    WHERE user_id = $2
    RETURNING language, user_id
  `;
  
  db.query(query, ['el', 3], (err, result) => {
    if (err) {
      console.error('❌ Update failed:', err);
      process.exit(1);
    }
    
    if (result.rows.length === 0) {
      console.log('⚠️ No user_settings record found for user_id 3');
      
      // Try to create one
      const createQuery = `
        INSERT INTO user_settings (user_id, language) 
        VALUES ($1, $2) 
        RETURNING language, user_id
      `;
      
      db.query(createQuery, [3, 'el'], (createErr, createResult) => {
        if (createErr) {
          console.error('❌ Create failed:', createErr);
          process.exit(1);
        }
        console.log('✅ Created new settings record:', createResult.rows[0]);
        process.exit(0);
      });
    } else {
      console.log('✅ Update successful:', result.rows[0]);
      process.exit(0);
    }
  });
};

testUpdate();

