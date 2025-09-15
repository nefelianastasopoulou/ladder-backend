-- Remove unique constraint from email field
-- This allows multiple users to have the same email address

-- For PostgreSQL: Try to drop common constraint names
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE users DROP CONSTRAINT IF EXISTS email_unique;
ALTER TABLE users DROP CONSTRAINT IF EXISTS unique_email;

-- Create index on email for performance (not unique)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
