const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixLikesCount() {
  try {
    console.log('🔧 Starting likes count synchronization...');
    
    // Get all posts with their current likes_count
    const postsResult = await pool.query(`
      SELECT id, title, likes_count 
      FROM posts 
      ORDER BY id
    `);
    
    console.log(`📊 Found ${postsResult.rows.length} posts to check`);
    
    let fixedCount = 0;
    
    for (const post of postsResult.rows) {
      // Count actual likes for this post
      const likesResult = await pool.query(`
        SELECT COUNT(*) as actual_likes 
        FROM likes 
        WHERE post_id = $1
      `, [post.id]);
      
      const actualLikes = parseInt(likesResult.rows[0].actual_likes);
      const currentCount = post.likes_count || 0;
      
      if (actualLikes !== currentCount) {
        console.log(`🔍 Post "${post.title}" (ID: ${post.id}):`);
        console.log(`   Current count: ${currentCount}`);
        console.log(`   Actual likes: ${actualLikes}`);
        
        // Update the likes_count to match actual likes
        await pool.query(`
          UPDATE posts 
          SET likes_count = $1 
          WHERE id = $2
        `, [actualLikes, post.id]);
        
        console.log(`   ✅ Fixed: Updated to ${actualLikes}`);
        fixedCount++;
      } else {
        console.log(`✅ Post "${post.title}" (ID: ${post.id}): Count is correct (${actualLikes})`);
      }
    }
    
    console.log(`\n🎯 Synchronization complete!`);
    console.log(`📈 Fixed ${fixedCount} posts with incorrect like counts`);
    
    // Show final summary
    const summaryResult = await pool.query(`
      SELECT 
        p.id, 
        p.title, 
        p.likes_count,
        COUNT(l.id) as actual_likes
      FROM posts p
      LEFT JOIN likes l ON p.id = l.post_id
      GROUP BY p.id, p.title, p.likes_count
      ORDER BY p.id
    `);
    
    console.log('\n📋 Final Summary:');
    console.log('ID | Title | Stored Count | Actual Likes | Status');
    console.log('---|-------|--------------|--------------|--------');
    
    for (const row of summaryResult.rows) {
      const status = row.likes_count === row.actual_likes ? '✅' : '❌';
      console.log(`${row.id} | ${row.title} | ${row.likes_count} | ${row.actual_likes} | ${status}`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing likes count:', error);
  } finally {
    await pool.end();
  }
}

fixLikesCount();
