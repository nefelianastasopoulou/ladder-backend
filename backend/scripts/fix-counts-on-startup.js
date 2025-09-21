const db = require('../database');

async function fixCountsOnStartup() {
  try {
    console.log('🔧 Fixing likes and comments counts on startup...');
    
    // Fix likes counts
    await db.query(`
      UPDATE posts 
      SET likes_count = (
        SELECT COUNT(*) 
        FROM likes 
        WHERE likes.post_id = posts.id
      )
    `);
    
    // Fix comments counts
    await db.query(`
      UPDATE posts 
      SET comments_count = (
        SELECT COUNT(*) 
        FROM comments 
        WHERE comments.post_id = posts.id
      )
    `);
    
    console.log('✅ Counts fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing counts:', error);
  }
}

module.exports = fixCountsOnStartup;
