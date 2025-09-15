const { Pool } = require('pg');
const path = require('path');

class DatabaseMigrator {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      });
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Error connecting to database:', error);
      throw error;
    }
  }

  async checkTableExists(tableName) {
    try {
      const result = await this.pool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1",
        [tableName]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking table existence:', error);
      throw error;
    }
  }

  async createUsersTable() {
    try {
      const exists = await this.checkTableExists('users');
      if (!exists) {
        await this.pool.query(`
          CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(255),
            username VARCHAR(100) UNIQUE,
            profile_picture VARCHAR(500),
            bio TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_admin BOOLEAN DEFAULT FALSE
          )
        `);
        console.log('✅ Users table created successfully');
      } else {
        console.log('✅ Users table already exists');
        // Check if full_name column exists, if not add it
        await this.addFullNameColumn();
      }
    } catch (error) {
      console.error('Error creating users table:', error);
      throw error;
    }
  }

  async addFullNameColumn() {
    try {
      const result = await this.pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'full_name'
      `);
      
      if (result.rows.length === 0) {
        await this.pool.query('ALTER TABLE users ADD COLUMN full_name VARCHAR(255)');
        console.log('✅ Added full_name column to users table');
      } else {
        console.log('✅ full_name column already exists');
      }
    } catch (error) {
      console.error('❌ Error adding full_name column:', error);
      throw error;
    }
  }

  async createPostsTable() {
    try {
      const exists = await this.checkTableExists('posts');
      if (!exists) {
        await this.pool.query(`
          CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            image_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Posts table created successfully');
      } else {
        console.log('✅ Posts table already exists');
      }
    } catch (error) {
      console.error('Error creating posts table:', error);
      throw error;
    }
  }

  async createLikesTable() {
    try {
      const exists = await this.checkTableExists('likes');
      if (!exists) {
        await this.pool.query(`
          CREATE TABLE likes (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, post_id)
          )
        `);
        console.log('✅ Likes table created successfully');
      } else {
        console.log('✅ Likes table already exists');
      }
    } catch (error) {
      console.error('Error creating likes table:', error);
      throw error;
    }
  }

  async createCommentsTable() {
    try {
      const exists = await this.checkTableExists('comments');
      if (!exists) {
        await this.pool.query(`
          CREATE TABLE comments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Comments table created successfully');
      } else {
        console.log('✅ Comments table already exists');
      }
    } catch (error) {
      console.error('Error creating comments table:', error);
      throw error;
    }
  }

  async createFollowsTable() {
    try {
      const exists = await this.checkTableExists('follows');
      if (!exists) {
        await this.pool.query(`
          CREATE TABLE follows (
            id SERIAL PRIMARY KEY,
            follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(follower_id, following_id)
          )
        `);
        console.log('✅ Follows table created successfully');
      } else {
        console.log('✅ Follows table already exists');
      }
    } catch (error) {
      console.error('Error creating follows table:', error);
      throw error;
    }
  }

  async createPasswordResetTokensTable() {
    try {
      const exists = await this.checkTableExists('password_reset_tokens');
      if (!exists) {
        await this.pool.query(`
          CREATE TABLE password_reset_tokens (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            token VARCHAR(255) UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Password reset tokens table created successfully');
      } else {
        console.log('✅ Password reset tokens table already exists');
      }
    } catch (error) {
      console.error('Error creating password reset tokens table:', error);
      throw error;
    }
  }

  async migrate() {
    try {
      await this.connect();
      await this.createUsersTable();
      await this.createPostsTable();
      await this.createLikesTable();
      await this.createCommentsTable();
      await this.createFollowsTable();
      await this.createPasswordResetTokensTable();
      console.log('🎉 All database migrations completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      if (this.pool) {
        await this.pool.end();
      }
    }
  }
}

module.exports = DatabaseMigrator;