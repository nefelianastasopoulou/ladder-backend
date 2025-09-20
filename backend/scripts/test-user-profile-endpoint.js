const db = require('../database');

async function testUserProfileEndpoint() {
  try {
    console.log('🔍 Testing user profile endpoint...');
    
    // Test with user ID 1 (the admin user)
    const userId = 1;
    console.log(`📊 Testing user profile lookup for userId: ${userId}`);
    
    const query = `
      SELECT 
        id, username, full_name, bio, location, field, 
        avatar_url, created_at, role, is_verified
      FROM users 
      WHERE id = $1
    `;
    
    const result = await db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found for userId:', userId);
    } else {
      const user = result.rows[0];
      console.log('✅ User profile found:');
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Username: "${user.username}"`);
      console.log(`  - Full Name: "${user.full_name}"`);
      console.log(`  - Role: "${user.role}"`);
      console.log(`  - Bio: "${user.bio}"`);
      console.log(`  - Location: "${user.location}"`);
      console.log(`  - Avatar URL: "${user.avatar_url}"`);
    }
    
    // Test with string userId
    console.log('\n🔍 Testing with string userId...');
    const result2 = await db.query(query, [userId.toString()]);
    
    if (result2.rows.length === 0) {
      console.log('❌ User not found for string userId:', userId.toString());
    } else {
      console.log('✅ User profile found with string userId');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing user profile:', error);
    process.exit(1);
  }
}

testUserProfileEndpoint();
