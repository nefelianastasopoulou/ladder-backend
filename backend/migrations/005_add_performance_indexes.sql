-- Add performance indexes for better query performance
-- This migration adds indexes to improve database performance

-- Indexes for users table
-- Note: email index already exists from migration 004, username index exists due to UNIQUE constraint
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Indexes for posts table
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_is_published ON posts(is_published);

-- Indexes for communities table
CREATE INDEX IF NOT EXISTS idx_communities_created_by ON communities(created_by);
CREATE INDEX IF NOT EXISTS idx_communities_is_public ON communities(is_public);
CREATE INDEX IF NOT EXISTS idx_communities_created_at ON communities(created_at);

-- Indexes for community_members table
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_community ON community_members(user_id, community_id);

-- Indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);

-- Indexes for conversation_participants table
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_conversation ON conversation_participants(user_id, conversation_id);

-- Indexes for conversations table
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);

-- Indexes for opportunities table
CREATE INDEX IF NOT EXISTS idx_opportunities_created_by ON opportunities(created_by);
CREATE INDEX IF NOT EXISTS idx_opportunities_category ON opportunities(category);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(deadline);

-- Indexes for applications table
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_applied_date ON applications(applied_date);

-- Indexes for favorites table
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_opportunity_id ON favorites(opportunity_id);

-- Indexes for reports table
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_type ON reports(reported_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- Indexes for user_profiles table
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Indexes for user_settings table
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Indexes for password_reset_tokens table
-- Note: token index already exists due to UNIQUE constraint
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_posts_community_published_created ON posts(community_id, is_published, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_read_created ON messages(conversation_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_community_members_user_role ON community_members(user_id, role);
