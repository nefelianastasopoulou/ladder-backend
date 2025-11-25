#!/usr/bin/env node

// Database Seeding Script
// This script seeds the database with sample data for development and testing

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database connection
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.log('💡 Please set DATABASE_URL in your .env file or environment variables');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false,
});

// Sample data
const sampleData = {
  users: [
    {
      email: 'admin@ladder.com',
      username: 'admin',
      full_name: 'Admin User',
      password: '$2a$12$rcOa7RmocH0hbG0u9N76pOuRGw0z59SZ06JTyQtEjcQaXjnFAsjM.', // LadderAdmino3qbiaajanj!2024
      role: 'admin'
    },
    {
      email: 'john@example.com',
      username: 'john_doe',
      full_name: 'John Doe',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'user'
    },
    {
      email: 'jane@example.com',
      username: 'jane_smith',
      full_name: 'Jane Smith',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'user'
    }
  ],
  
  userProfiles: [
    {
      user_id: 1,
      bio: 'System administrator for Ladder platform',
      location: 'San Francisco, CA',
      field: 'Technology'
    },
    {
      user_id: 2,
      bio: 'Software engineer passionate about building great products',
      location: 'New York, NY',
      field: 'Engineering'
    },
    {
      user_id: 3,
      bio: 'Product manager with a focus on user experience',
      location: 'Seattle, WA',
      field: 'Product Management'
    }
  ],
  
  communities: [
    {
      name: 'Tech Enthusiasts',
      description: 'A community for technology enthusiasts to share ideas and opportunities',
      is_public: true,
      created_by: 1,
      member_count: 150
    },
    {
      name: 'Startup Founders',
      description: 'Connect with fellow entrepreneurs and startup founders',
      is_public: true,
      created_by: 2,
      member_count: 75
    },
    {
      name: 'Design Community',
      description: 'For designers to share their work and find opportunities',
      is_public: false,
      created_by: 3,
      member_count: 50
    }
  ],
  
  opportunities: [
    {
      title: 'Software Engineering Internship',
      description: 'Join our team as a software engineering intern and work on cutting-edge projects',
      category: 'internships',
      location: 'San Francisco, CA',
      duration: '3 months',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      created_by: 1
    },
    {
      title: 'Product Design Hackathon',
      description: 'Participate in our 48-hour product design hackathon and win amazing prizes',
      category: 'hackathons',
      location: 'New York, NY',
      duration: '2 days',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
      created_by: 2
    },
    {
      title: 'Marketing Coordinator Position',
      description: 'Full-time marketing coordinator position with growth opportunities',
      category: 'jobs',
      location: 'Remote',
      duration: 'Full-time',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
      created_by: 3
    }
  ],
  
  posts: [
    {
      title: 'Welcome to Ladder!',
      content: 'Welcome to our community! This is a place where you can share opportunities and connect with like-minded individuals.',
      category: 'announcement',
      author_id: 1,
      community_id: 1,
      is_published: true
    },
    {
      title: 'Tips for Landing Your Dream Internship',
      content: 'Here are some tips that helped me land my dream internship at a top tech company...',
      category: 'advice',
      author_id: 2,
      community_id: 1,
      is_published: true
    },
    {
      title: 'Building a Strong Portfolio',
      content: 'As a designer, having a strong portfolio is crucial. Here are some tips to make yours stand out...',
      category: 'advice',
      author_id: 3,
      community_id: 3,
      is_published: true
    }
  ]
};

// Check if data already exists
const checkExistingData = async () => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(result.rows[0].count);
    
    if (userCount > 0) {
      console.log(`⚠️  Database already contains ${userCount} users`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error checking existing data:', error);
    throw error;
  }
};

// Seed users
const seedUsers = async () => {
  try {
    console.log('🌱 Seeding users...');
    
    for (const user of sampleData.users) {
      await pool.query(
        'INSERT INTO users (email, username, full_name, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        [user.email, user.username, user.full_name, user.password, user.role]
      );
    }
    
    console.log(`✅ Seeded ${sampleData.users.length} users`);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

// Seed user profiles
const seedUserProfiles = async () => {
  try {
    console.log('🌱 Seeding user profiles...');
    
    for (const profile of sampleData.userProfiles) {
      await pool.query(
        'INSERT INTO user_profiles (user_id, bio, location, field) VALUES ($1, $2, $3, $4)',
        [profile.user_id, profile.bio, profile.location, profile.field]
      );
    }
    
    console.log(`✅ Seeded ${sampleData.userProfiles.length} user profiles`);
  } catch (error) {
    console.error('❌ Error seeding user profiles:', error);
    throw error;
  }
};

// Seed communities
const seedCommunities = async () => {
  try {
    console.log('🌱 Seeding communities...');
    
    for (const community of sampleData.communities) {
      await pool.query(
        'INSERT INTO communities (name, description, is_public, created_by, member_count) VALUES ($1, $2, $3, $4, $5)',
        [community.name, community.description, community.is_public, community.created_by, community.member_count]
      );
    }
    
    console.log(`✅ Seeded ${sampleData.communities.length} communities`);
  } catch (error) {
    console.error('❌ Error seeding communities:', error);
    throw error;
  }
};

// Seed opportunities
const seedOpportunities = async () => {
  try {
    console.log('🌱 Seeding opportunities...');
    
    for (const opportunity of sampleData.opportunities) {
      await pool.query(
        'INSERT INTO opportunities (title, description, category, location, duration, deadline, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [opportunity.title, opportunity.description, opportunity.category, opportunity.location, opportunity.duration, opportunity.deadline, opportunity.created_by]
      );
    }
    
    console.log(`✅ Seeded ${sampleData.opportunities.length} opportunities`);
  } catch (error) {
    console.error('❌ Error seeding opportunities:', error);
    throw error;
  }
};

// Seed posts
const seedPosts = async () => {
  try {
    console.log('🌱 Seeding posts...');
    
    for (const post of sampleData.posts) {
      await pool.query(
        'INSERT INTO posts (title, content, category, author_id, community_id, is_published) VALUES ($1, $2, $3, $4, $5, $6)',
        [post.title, post.content, post.category, post.author_id, post.community_id, post.is_published]
      );
    }
    
    console.log(`✅ Seeded ${sampleData.posts.length} posts`);
  } catch (error) {
    console.error('❌ Error seeding posts:', error);
    throw error;
  }
};

// Seed community members
const seedCommunityMembers = async () => {
  try {
    console.log('🌱 Seeding community members...');
    
    // Add users to communities
    const memberships = [
      { user_id: 1, community_id: 1, role: 'admin' },
      { user_id: 2, community_id: 1, role: 'member' },
      { user_id: 2, community_id: 2, role: 'admin' },
      { user_id: 3, community_id: 2, role: 'member' },
      { user_id: 3, community_id: 3, role: 'admin' }
    ];
    
    for (const membership of memberships) {
      await pool.query(
        'INSERT INTO community_members (user_id, community_id, role) VALUES ($1, $2, $3)',
        [membership.user_id, membership.community_id, membership.role]
      );
    }
    
    console.log(`✅ Seeded ${memberships.length} community memberships`);
  } catch (error) {
    console.error('❌ Error seeding community members:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async (force = false) => {
  try {
    console.log('🚀 Starting database seeding...');
    
    // Check if data already exists
    if (!force && await checkExistingData()) {
      console.log('❌ Database already contains data. Use --force to overwrite.');
      return;
    }
    
    // Clear existing data if force is true
    if (force) {
      console.log('🗑️  Clearing existing data...');
      await pool.query('DELETE FROM posts');
      await pool.query('DELETE FROM opportunities');
      await pool.query('DELETE FROM community_members');
      await pool.query('DELETE FROM communities');
      await pool.query('DELETE FROM user_profiles');
      await pool.query('DELETE FROM users');
      console.log('✅ Existing data cleared');
    }
    
    // Seed data in order (respecting foreign key constraints)
    await seedUsers();
    await seedUserProfiles();
    await seedCommunities();
    await seedOpportunities();
    await seedPosts();
    await seedCommunityMembers();
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📋 Sample accounts created:');
    console.log('  Admin: admin@ladder.com / password');
    console.log('  User 1: john@example.com / password');
    console.log('  User 2: jane@example.com / password');
    
  } catch (error) {
    console.error('💥 Database seeding failed:', error);
    throw error;
  } finally {
    // Close the pool when called from other scripts
    // This prevents connection cleanup errors
    try {
      if (pool && !pool.ended) {
        await pool.end();
      }
    } catch (closeError) {
      // Ignore errors during pool closure (connection may already be closed)
      // These are common during Railway deployments and can be safely ignored
      if (!closeError.message.includes('Connection terminated') && 
          !closeError.message.includes('ended') &&
          closeError.code !== 'ETIMEDOUT') {
        console.warn('⚠️  Warning during pool closure:', closeError.message);
      }
    }
  }
};

// Main function
const main = async () => {
  try {
    const force = process.argv.includes('--force');
    
    // seedDatabase now handles pool closure itself
    await seedDatabase(force);
    
  } catch (error) {
    console.error('💥 Seeding operation failed:', error);
    process.exit(1);
  }
};

// Run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { seedDatabase };
