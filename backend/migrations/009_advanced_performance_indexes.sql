-- Advanced Performance Indexes Migration
-- This migration adds comprehensive indexes to optimize query performance

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_posts_author_published_created ON posts(author_id, is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_community_published_created ON posts(community_id, is_published, created_at DESC);
-- Note: posts table doesn't have a category column, so this index is removed

-- User activity indexes
CREATE INDEX IF NOT EXISTS idx_users_created_at_desc ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));

-- Community performance indexes
CREATE INDEX IF NOT EXISTS idx_communities_public_member_count ON communities(is_public, member_count DESC);
CREATE INDEX IF NOT EXISTS idx_communities_created_by_created ON communities(created_by, created_at DESC);

-- Message and conversation indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_read ON messages(conversation_id, created_at DESC, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_updated ON conversations(id, updated_at DESC);

-- Application and opportunity indexes
CREATE INDEX IF NOT EXISTS idx_applications_user_status_created ON applications(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_status ON applications(opportunity_id, status);
-- Only create this index if the category column exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'category') THEN
        CREATE INDEX IF NOT EXISTS idx_opportunities_category_deadline ON opportunities(category, deadline);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_opportunities_created_by_created ON opportunities(created_by, created_at DESC);

-- Favorites and likes indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_created ON favorites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_created ON likes(post_id, created_at DESC);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_author_created ON comments(author_id, created_at DESC);

-- Follow relationships
CREATE INDEX IF NOT EXISTS idx_follows_follower_created ON follows(follower_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_following_created ON follows(following_id, created_at DESC);

-- Reports and moderation
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_type_id_status ON reports(reported_type, reported_id, status);

-- User profiles and settings
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Community members with role optimization
CREATE INDEX IF NOT EXISTS idx_community_members_community_role ON community_members(community_id, role);
CREATE INDEX IF NOT EXISTS idx_community_members_user_role ON community_members(user_id, role);

-- Partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_posts_published_recent ON posts(created_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_communities_public_active ON communities(member_count DESC) WHERE is_public = true AND member_count > 0;
CREATE INDEX IF NOT EXISTS idx_messages_unread_recent ON messages(created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_applications_pending ON applications(created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_opportunities_active ON opportunities(deadline) WHERE deadline > NOW();

-- Text search indexes (if using PostgreSQL full-text search)
CREATE INDEX IF NOT EXISTS idx_posts_content_search ON posts USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_posts_title_search ON posts USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_opportunities_title_search ON opportunities USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_opportunities_description_search ON opportunities USING gin(to_tsvector('english', description));

-- Statistics update to help query planner
ANALYZE;
