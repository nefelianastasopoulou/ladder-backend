const db = require('./database');

console.log('🔍 Checking user_settings table schema...');

const query = `
  SELECT column_name, data_type, is_nullable, column_default 
  FROM information_schema.columns 
  WHERE table_name = 'user_settings' 
  ORDER BY ordinal_position
`;

db.query(query, (err, result) => {
  if (err) {
    console.error('❌ Error checking schema:', err);
    process.exit(1);
  }
  
  console.log('📋 user_settings table columns:');
  result.rows.forEach(row => {
    console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
  });
  
  const hasLanguage = result.rows.some(row => row.column_name === 'language');
  console.log(`\n🌐 Language column exists: ${hasLanguage ? '✅ YES' : '❌ NO'}`);
  
  process.exit(0);
});