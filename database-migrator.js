const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseMigrator {
  constructor() {
    this.dbPath = path.join(__dirname, 'database.sqlite');
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Database connected successfully');
          resolve();
        }
      });
    });
  }

  async checkTableExists(tableName) {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(!!row);
          }
        }
      );
    });
  }

  async createTableIfNotExists(tableName, createSQL) {
    const exists = await this.checkTableExists(tableName);
    if (!exists) {
      console.log(`Creating ${tableName} table...`);
      return new Promise((resolve, reject) => {
        this.db.run(createSQL, (err) => {
          if (err) {
            console.error(`Error creating ${tableName} table:`, err);
            reject(err);
          } else {
            console.log(`${tableName} table created successfully`);
            resolve();
          }
        });
      });
    } else {
      console.log(`${tableName} table already exists`);
    }
  }

  async addColumnIfNotExists(tableName, columnName, columnDefinition) {
    return new Promise((resolve, reject) => {
      // Check if column exists
      this.db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
        if (err) {
          reject(err);
          return;
        }

        const columnExists = columns.some(col => col.name === columnName);
        if (!columnExists) {
          console.log(`Adding column ${columnName} to ${tableName} table...`);
          this.db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`, (err) => {
            if (err) {
              console.error(`Error adding column ${columnName}:`, err);
              reject(err);
            } else {
              console.log(`Column ${columnName} added successfully`);
              resolve();
            }
          });
        } else {
          console.log(`Column ${columnName} already exists in ${tableName}`);
          resolve();
        }
      });
    });
  }

  async migrate() {
    try {
      await this.connect();

      // Create users table
      await this.createTableIfNotExists('users', `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          email TEXT UNIQUE,
          password TEXT NOT NULL,
          full_name TEXT NOT NULL,
          is_admin BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create profiles table
      await this.createTableIfNotExists('profiles', `
        CREATE TABLE profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER UNIQUE,
          avatar_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Create opportunities table
      await this.createTableIfNotExists('opportunities', `
        CREATE TABLE opportunities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          company TEXT NOT NULL,
          description TEXT NOT NULL,
          location TEXT,
          type TEXT,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `);

      // Create favorites table
      await this.createTableIfNotExists('favorites', `
        CREATE TABLE favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          opportunity_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (opportunity_id) REFERENCES opportunities (id)
        )
      `);

      // Create applications table
      await this.createTableIfNotExists('applications', `
        CREATE TABLE applications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          opportunity_id INTEGER,
          status TEXT DEFAULT 'applied',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (opportunity_id) REFERENCES opportunities (id)
        )
      `);

      // Create email_changes table
      await this.createTableIfNotExists('email_changes', `
        CREATE TABLE email_changes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          new_email TEXT NOT NULL,
          verification_code TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Create user_settings table
      await this.createTableIfNotExists('user_settings', `
        CREATE TABLE user_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER UNIQUE,
          posts_on_profile_visibility TEXT DEFAULT 'everyone',
          show_online_status BOOLEAN DEFAULT 1,
          push_notifications BOOLEAN DEFAULT 1,
          email_notifications BOOLEAN DEFAULT 1,
          language TEXT DEFAULT 'en',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Create communities table
      await this.createTableIfNotExists('communities', `
        CREATE TABLE communities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT,
          created_by INTEGER,
          member_count INTEGER DEFAULT 0,
          is_public BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `);

      // Create posts table
      await this.createTableIfNotExists('posts', `
        CREATE TABLE posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          author_id INTEGER,
          community_id INTEGER,
          image_url TEXT,
          likes_count INTEGER DEFAULT 0,
          comments_count INTEGER DEFAULT 0,
          is_published BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (author_id) REFERENCES users (id),
          FOREIGN KEY (community_id) REFERENCES communities (id)
        )
      `);

      // Create community_members table
      await this.createTableIfNotExists('community_members', `
        CREATE TABLE community_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          community_id INTEGER,
          role TEXT DEFAULT 'member',
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (community_id) REFERENCES communities (id),
          UNIQUE(user_id, community_id)
        )
      `);

      // Create conversations table
      await this.createTableIfNotExists('conversations', `
        CREATE TABLE conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT DEFAULT 'individual',
          name TEXT,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `);

      // Create conversation_participants table
      await this.createTableIfNotExists('conversation_participants', `
        CREATE TABLE conversation_participants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id INTEGER,
          user_id INTEGER,
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (conversation_id) REFERENCES conversations (id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(conversation_id, user_id)
        )
      `);

      // Create messages table
      await this.createTableIfNotExists('messages', `
        CREATE TABLE messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id INTEGER,
          sender_id INTEGER,
          content TEXT NOT NULL,
          message_type TEXT DEFAULT 'text',
          is_read BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (conversation_id) REFERENCES conversations (id),
          FOREIGN KEY (sender_id) REFERENCES users (id)
        )
      `);

      // Create reports table
      await this.createTableIfNotExists('reports', `
        CREATE TABLE reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reporter_id INTEGER NOT NULL,
          reported_type TEXT NOT NULL CHECK (reported_type IN ('user', 'community', 'post')),
          reported_id INTEGER NOT NULL,
          reason TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
          reviewed_by INTEGER,
          reviewed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (reporter_id) REFERENCES users (id),
          FOREIGN KEY (reviewed_by) REFERENCES users (id)
        )
      `);

      // Add any missing columns to existing tables
      await this.addColumnIfNotExists('users', 'username', 'TEXT UNIQUE');
      await this.addColumnIfNotExists('users', 'full_name', 'TEXT NOT NULL');
      await this.addColumnIfNotExists('users', 'is_admin', 'BOOLEAN DEFAULT 0');

      console.log('✅ Database migration completed successfully!');
      console.log('✅ All existing data has been preserved!');

    } catch (error) {
      console.error('❌ Database migration failed:', error);
      throw error;
    } finally {
      if (this.db) {
        this.db.close();
      }
    }
  }
}

// Export for use in server.js
module.exports = DatabaseMigrator;

// If run directly, perform migration
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  migrator.migrate().catch(console.error);
}
