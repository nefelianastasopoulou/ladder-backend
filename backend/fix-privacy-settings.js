const db = require('./database');

async function fixPrivacySettings() {
  try {
    console.log('🔧 Fixing privacy settings...');
    
    // Step 1: Drop old constraints
    console.log('1. Dropping old constraints...');
    await db.query('ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS check_community_posts_visibility_valid');
    await db.query('ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS check_posts_on_profile_visibility_valid');
    await db.query('ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS check_photo_upload_restriction_valid');
    
    // Step 2: Update existing data
    console.log('2. Updating existing data...');
    await db.query(`
      UPDATE user_settings 
      SET 
        community_posts_visibility = CASE 
          WHEN community_posts_visibility = 'public' THEN 'everyone'
          WHEN community_posts_visibility = 'private' THEN 'none'
          WHEN community_posts_visibility = 'friends' THEN 'connections'
          ELSE 'everyone'
        END,
        posts_on_profile_visibility = CASE 
          WHEN posts_on_profile_visibility = 'public' THEN 'everyone'
          WHEN posts_on_profile_visibility = 'private' THEN 'none'
          WHEN posts_on_profile_visibility = 'friends' THEN 'connections'
          ELSE 'everyone'
        END,
        photo_upload_restriction = CASE 
          WHEN photo_upload_restriction = 'all' THEN 'everyone'
          WHEN photo_upload_restriction = 'none' THEN 'none'
          WHEN photo_upload_restriction = 'friends' THEN 'connections'
          ELSE 'everyone'
        END
    `);
    
    // Step 3: Add new constraints
    console.log('3. Adding new constraints...');
    await db.query(`
      ALTER TABLE user_settings ADD CONSTRAINT check_community_posts_visibility_valid 
      CHECK (community_posts_visibility IN ('everyone', 'connections', 'none'))
    `);
    
    await db.query(`
      ALTER TABLE user_settings ADD CONSTRAINT check_posts_on_profile_visibility_valid 
      CHECK (posts_on_profile_visibility IN ('everyone', 'connections', 'none'))
    `);
    
    await db.query(`
      ALTER TABLE user_settings ADD CONSTRAINT check_photo_upload_restriction_valid 
      CHECK (photo_upload_restriction IN ('everyone', 'connections', 'none'))
    `);
    
    await db.query(`
      ALTER TABLE user_settings ADD CONSTRAINT check_opportunities_visibility_valid 
      CHECK (opportunities_on_profile_visibility IN ('everyone', 'connections', 'none'))
    `);
    
    await db.query(`
      ALTER TABLE user_settings ADD CONSTRAINT check_applications_visibility_valid 
      CHECK (applications_on_profile_visibility IN ('everyone', 'connections', 'none'))
    `);
    
    console.log('✅ Privacy settings fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing privacy settings:', error);
  } finally {
    process.exit(0);
  }
}

fixPrivacySettings();
