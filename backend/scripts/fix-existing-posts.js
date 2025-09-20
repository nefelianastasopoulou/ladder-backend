const db = require('../database');

async function fixExistingPosts() {
  try {
    console.log('🔧 Fixing existing posts...');
    
    // Update all posts that don't have is_published set
    const result = await db.query(`
      UPDATE posts 
      SET is_published = true 
      WHERE is_published IS NULL
    `);
    
    console.log(`✅ Updated ${result.rowCount} posts to be published`);
    
    // Verify the update
    const countResult = await db.query(`
      SELECT COUNT(*) as total_published 
      FROM posts 
      WHERE is_published = true
    `);
    
    console.log(`📊 Total published posts: ${countResult.rows[0].total_published}`);
    
    // Show some sample posts
    const samplePosts = await db.query(`
      SELECT id, title, community_id, is_published, created_at
      FROM posts 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('📝 Recent posts:');
    samplePosts.rows.forEach(post => {
      console.log(`  - ID: ${post.id}, Title: "${post.title}", Community: ${post.community_id}, Published: ${post.is_published}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing posts:', error);
    process.exit(1);
  }
}

fixExistingPosts();
