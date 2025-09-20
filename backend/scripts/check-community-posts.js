const db = require('../database');

async function checkCommunityPosts() {
  try {
    console.log('🔍 Checking community posts...');
    
    // Get all posts with their community info
    const posts = await db.query(`
      SELECT 
        p.id, p.title, p.content, p.community_id, p.is_published, p.created_at,
        c.name as community_name
      FROM posts p
      LEFT JOIN communities c ON p.community_id = c.id
      ORDER BY p.created_at DESC
    `);
    
    console.log(`📊 Total posts: ${posts.rows.length}`);
    console.log('\n📝 All posts:');
    posts.rows.forEach(post => {
      const communityInfo = post.community_id ? 
        `Community: ${post.community_name} (ID: ${post.community_id})` : 
        'Platform post (no community)';
      console.log(`  - ID: ${post.id}, Title: "${post.title}"`);
      console.log(`    ${communityInfo}, Published: ${post.is_published}`);
      console.log(`    Created: ${post.created_at}`);
      console.log('');
    });
    
    // Get all communities
    const communities = await db.query(`
      SELECT id, name, description, created_at
      FROM communities
      ORDER BY created_at DESC
    `);
    
    console.log(`\n🏘️ Total communities: ${communities.rows.length}`);
    console.log('📝 All communities:');
    communities.rows.forEach(community => {
      console.log(`  - ID: ${community.id}, Name: "${community.name}"`);
      console.log(`    Description: "${community.description}"`);
      console.log(`    Created: ${community.created_at}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking posts:', error);
    process.exit(1);
  }
}

checkCommunityPosts();
