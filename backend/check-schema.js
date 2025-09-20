const db = require('./database');

async function checkSchema() {
  try {
    console.log('🔍 Checking user_settings table schema...');
    
    // Check all columns in user_settings table
    const result = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_settings' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 All columns in user_settings table:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check specifically for visibility columns
    const visibilityColumns = result.rows.filter(row => 
      row.column_name.includes('visibility')
    );
    
    console.log('\n🔒 Visibility-related columns:');
    visibilityColumns.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Check current data
    const dataResult = await db.query('SELECT * FROM user_settings LIMIT 1');
    if (dataResult.rows.length > 0) {
      console.log('\n📊 Sample user_settings data:');
      const sample = dataResult.rows[0];
      Object.keys(sample).forEach(key => {
        if (key.includes('visibility')) {
          console.log(`  - ${key}: ${sample[key]}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    process.exit(0);
  }
}

checkSchema();
