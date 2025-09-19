/**
 * Create Admin User Script
 * Creates an admin user with the specified credentials
 */

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false,
});

const createAdminUser = async () => {
  try {
    console.log('🔧 Creating admin user...');
    
    const email = 'admin@ladder.com';
    const username = 'admin';
    const fullName = 'Admin User';
    const password = 'LadderAdmino3qbiaajanj!2024';
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️  Admin user already exists, updating password...');
      
      // Hash the new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Update the existing user's password
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 OR username = $3',
        [hashedPassword, email, username]
      );
      
      console.log('✅ Admin user password updated successfully');
    } else {
      console.log('➕ Creating new admin user...');
      
      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Create user
      const newUser = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, username, role, is_active, created_at)
         VALUES ($1, $2, $3, $4, 'admin', true, NOW())
         RETURNING id, email, username, full_name, role, created_at`,
        [email, hashedPassword, fullName, username]
      );
      
      const user = newUser.rows[0];
      console.log('✅ Admin user created successfully:', {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        isAdmin: user.role === 'admin'
      });
    }
    
    console.log('🎉 Admin user setup complete!');
    console.log('📋 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the script
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };
