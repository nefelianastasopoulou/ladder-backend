const db = require('./database');

console.log('🔍 Checking language constraint...');

const query = `
  SELECT conname, pg_get_constraintdef(oid) as definition
  FROM pg_constraint 
  WHERE conname = 'check_language_valid'
`;

db.query(query, (err, result) => {
  if (err) {
    console.error('❌ Error checking constraints:', err);
    process.exit(1);
  }
  
  if (result.rows.length === 0) {
    console.log('⚠️ No language constraint found');
  } else {
    console.log('📋 Language constraint:', result.rows[0]);
  }
  
  // Also check what language values are currently in the database
  const langQuery = `
    SELECT DISTINCT language 
    FROM user_settings 
    WHERE language IS NOT NULL
  `;
  
  db.query(langQuery, (langErr, langResult) => {
    if (langErr) {
      console.error('❌ Error checking language values:', langErr);
      process.exit(1);
    }
    
    console.log('🌐 Current language values in database:', langResult.rows);
    process.exit(0);
  });
});
