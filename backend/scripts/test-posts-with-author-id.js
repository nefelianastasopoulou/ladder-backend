const db = require('../database');

async function testPostsWithAuthorId() {
  try {
    console.log('🔍 Testing posts with author_id...');
    
    // Test platform posts query
    const platformPosts = await db.query(`
      SELECT 
        p.id, p.title, p.content, p.image_url, p.likes_count, p.comments_count,
        p.created_at, p.updated_at, p.author_id,
        u.username as author_username, u.full_name as author_name, u.avatar_url as author_avatar
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.community_id IS NULL AND p.is_published = true
      ORDER BY p.created_at DESC
      LIMIT 5
    `);
    
    console.log(`📊 Platform posts found: ${platformPosts.rows.length}`);
    console.log('📝 Platform posts with author_id:');
    platformPosts.rows.forEach(post => {
      console.log(`  - ID: ${post.id}, Title: "${post.title}"`);
      console.log(`    Author ID: ${post.author_id}, Author Name: "${post.author_name}"`);
      console.log(`    Author Username: "${post.author_username}"`);
      console.log('');
    });
    
    // Test if we can get user profile by ID
    if (platformPosts.rows.length > 0 && platformPosts.rows[0].author_id) {
      const authorId = platformPosts.rows[0].author_id;
      console.log(`🔍 Testing user profile lookup for author_id: ${authorId}`);
      
      const userProfile = await db.query(`
        SELECT 
          id, username, full_name, bio, location, field, 
          avatar_url, created_at, role, is_verified
        FROM users 
        WHERE id = $1
      `, [authorId]);
      
      if (userProfile.rows.length > 0) {
        console.log('✅ User profile found:');
        console.log(`  - ID: ${userProfile.rows[0].id}`);
        console.log(`  - Username: "${userProfile.rows[0].username}"`);
        console.log(`  - Full Name: "${userProfile.rows[0].full_name}"`);
        console.log(`  - Role: "${userProfile.rows[0].role}"`);
      } else {
        console.log('❌ User profile not found for author_id:', authorId);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing posts:', error);
    process.exit(1);
  }
}

testPostsWithAuthorId();
