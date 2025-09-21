const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('🔧 Running migration 018: Fix likes and comments count synchronization...');
    
    // Update all posts to have the correct likes_count
    console.log('📊 Updating likes_count...');
    const likesResult = await pool.query(`
      UPDATE posts 
      SET likes_count = (
        SELECT COUNT(*) 
        FROM likes 
        WHERE likes.post_id = posts.id
      )
    `);
    console.log(`✅ Updated ${likesResult.rowCount} posts for likes_count`);

    // Update all posts to have the correct comments_count
    console.log('📊 Updating comments_count...');
    const commentsResult = await pool.query(`
      UPDATE posts 
      SET comments_count = (
        SELECT COUNT(*) 
        FROM comments 
        WHERE comments.post_id = posts.id
      )
    `);
    console.log(`✅ Updated ${commentsResult.rowCount} posts for comments_count`);

    // Verify the fix by showing the results
    console.log('\n📋 Verification Results:');
    const verifyResult = await pool.query(`
      SELECT 
        p.id, 
        p.title, 
        p.likes_count as stored_likes,
        COUNT(l.id) as actual_likes,
        p.comments_count as stored_comments,
        COUNT(c.id) as actual_comments,
        CASE 
          WHEN p.likes_count = COUNT(l.id) AND p.comments_count = COUNT(c.id) THEN 'SYNCED' 
          ELSE 'MISMATCH' 
        END as status
      FROM posts p
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      GROUP BY p.id, p.title, p.likes_count, p.comments_count
      ORDER BY p.id
    `);

    console.log('ID | Title | Stored Likes | Actual Likes | Stored Comments | Actual Comments | Status');
    console.log('---|-------|--------------|--------------|-----------------|-----------------|--------');
    
    for (const row of verifyResult.rows) {
      console.log(`${row.id} | ${row.title} | ${row.stored_likes} | ${row.actual_likes} | ${row.stored_comments} | ${row.actual_comments} | ${row.status}`);
    }
    
    console.log('\n🎯 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
