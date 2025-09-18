-- Fix database schema issues and improve constraints
-- This migration addresses data type inconsistencies and adds missing constraints

-- Fix boolean fields to use proper BOOLEAN type instead of INTEGER
-- Note: PostgreSQL handles this automatically, but we'll add explicit constraints

-- Add check constraints for boolean fields (with IF NOT EXISTS to prevent errors)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_is_admin_boolean') THEN
        ALTER TABLE users ADD CONSTRAINT check_is_admin_boolean CHECK (is_admin IN (true, false));
    END IF;
END $$;

-- Add check constraints for communities
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_is_public_boolean') THEN
        ALTER TABLE communities ADD CONSTRAINT check_is_public_boolean CHECK (is_public IN (true, false));
    END IF;
END $$;

-- Add check constraints for posts
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_is_published_boolean') THEN
        ALTER TABLE posts ADD CONSTRAINT check_is_published_boolean CHECK (is_published IN (true, false));
    END IF;
END $$;

-- Add check constraints for messages
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_is_read_boolean') THEN
        ALTER TABLE messages ADD CONSTRAINT check_is_read_boolean CHECK (is_read IN (true, false));
    END IF;
END $$;

-- Add check constraints for user settings (with IF NOT EXISTS)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_email_notifications_boolean') THEN
        ALTER TABLE user_settings ADD CONSTRAINT check_email_notifications_boolean CHECK (email_notifications IN (true, false));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_push_notifications_boolean') THEN
        ALTER TABLE user_settings ADD CONSTRAINT check_push_notifications_boolean CHECK (push_notifications IN (true, false));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_sound_vibration_boolean') THEN
        ALTER TABLE user_settings ADD CONSTRAINT check_sound_vibration_boolean CHECK (sound_vibration IN (true, false));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_location_services_boolean') THEN
        ALTER TABLE user_settings ADD CONSTRAINT check_location_services_boolean CHECK (location_services IN (true, false));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_show_activity_status_boolean') THEN
        ALTER TABLE user_settings ADD CONSTRAINT check_show_activity_status_boolean CHECK (show_activity_status IN (true, false));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_show_last_seen_boolean') THEN
        ALTER TABLE user_settings ADD CONSTRAINT check_show_last_seen_boolean CHECK (show_last_seen IN (true, false));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_allow_direct_messages_boolean') THEN
        ALTER TABLE user_settings ADD CONSTRAINT check_allow_direct_messages_boolean CHECK (allow_direct_messages IN (true, false));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_allow_connection_requests_boolean') THEN
        ALTER TABLE user_settings ADD CONSTRAINT check_allow_connection_requests_boolean CHECK (allow_connection_requests IN (true, false));
    END IF;
END $$;

-- Add check constraints for opportunities
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_is_external_application_boolean') THEN
        ALTER TABLE opportunities ADD CONSTRAINT check_is_external_application_boolean CHECK (is_external_application IN (true, false));
    END IF;
END $$;

-- Add check constraints for applications
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_status_valid') THEN
        ALTER TABLE applications ADD CONSTRAINT check_status_valid CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn'));
    END IF;
END $$;

-- Add check constraints for reports
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_reported_type_valid') THEN
        ALTER TABLE reports ADD CONSTRAINT check_reported_type_valid CHECK (reported_type IN ('user', 'community', 'post'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_reports_status_valid') THEN
        ALTER TABLE reports ADD CONSTRAINT check_reports_status_valid CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed'));
    END IF;
END $$;

-- Add check constraints for community members
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_role_valid') THEN
        ALTER TABLE community_members ADD CONSTRAINT check_role_valid CHECK (role IN ('member', 'admin', 'moderator'));
    END IF;
END $$;

-- Add check constraints for conversations
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_type_valid') THEN
        ALTER TABLE conversations ADD CONSTRAINT check_type_valid CHECK (type IN ('individual', 'group', 'community'));
    END IF;
END $$;

-- Add check constraints for messages
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_message_type_valid') THEN
        ALTER TABLE messages ADD CONSTRAINT check_message_type_valid CHECK (message_type IN ('text', 'image', 'file', 'system'));
    END IF;
END $$;

-- Add check constraints for user settings
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_language_valid') THEN
        ALTER TABLE user_settings ADD CONSTRAINT check_language_valid CHECK (language IN ('en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_community_posts_visibility_valid') THEN
        ALTER TABLE user_settings ADD CONSTRAINT check_community_posts_visibility_valid CHECK (community_posts_visibility IN ('public', 'friends', 'private'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_photo_upload_restriction_valid') THEN
        ALTER TABLE user_settings ADD CONSTRAINT check_photo_upload_restriction_valid CHECK (photo_upload_restriction IN ('all', 'restricted', 'none'));
    END IF;
END $$;

-- Add additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_communities_member_count ON communities(member_count);
CREATE INDEX IF NOT EXISTS idx_posts_is_published ON posts(is_published);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_type ON reports(reported_type);
CREATE INDEX IF NOT EXISTS idx_community_members_role ON community_members(role);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_posts_author_published ON posts(author_id, is_published);
CREATE INDEX IF NOT EXISTS idx_posts_community_published ON posts(community_id, is_published);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_read ON messages(conversation_id, is_read);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reports_type_status ON reports(reported_type, status);

-- Add partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_posts_published_only ON posts(created_at) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_communities_public_only ON communities(member_count) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_messages_unread_only ON messages(created_at) WHERE is_read = false;

-- Add constraints for data integrity (with IF NOT EXISTS checks)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_username_length') THEN
        ALTER TABLE users ADD CONSTRAINT check_username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_email_format') THEN
        ALTER TABLE users ADD CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_full_name_length') THEN
        ALTER TABLE users ADD CONSTRAINT check_full_name_length CHECK (char_length(full_name) >= 2 AND char_length(full_name) <= 100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_title_length') THEN
        ALTER TABLE posts ADD CONSTRAINT check_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_posts_content_length') THEN
        ALTER TABLE posts ADD CONSTRAINT check_posts_content_length CHECK (char_length(content) >= 10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_name_length') THEN
        ALTER TABLE communities ADD CONSTRAINT check_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_member_count_positive') THEN
        ALTER TABLE communities ADD CONSTRAINT check_member_count_positive CHECK (member_count >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_post_count_positive') THEN
        ALTER TABLE communities ADD CONSTRAINT check_post_count_positive CHECK (post_count >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_messages_content_length') THEN
        ALTER TABLE messages ADD CONSTRAINT check_messages_content_length CHECK (char_length(content) >= 1);
    END IF;
END $$;

-- Add foreign key constraints that might be missing (with IF NOT EXISTS checks)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_posts_author') THEN
        ALTER TABLE posts ADD CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_posts_community') THEN
        ALTER TABLE posts ADD CONSTRAINT fk_posts_community FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_communities_creator') THEN
        ALTER TABLE communities ADD CONSTRAINT fk_communities_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_community_members_user') THEN
        ALTER TABLE community_members ADD CONSTRAINT fk_community_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_community_members_community') THEN
        ALTER TABLE community_members ADD CONSTRAINT fk_community_members_community FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_messages_conversation') THEN
        ALTER TABLE messages ADD CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_messages_sender') THEN
        ALTER TABLE messages ADD CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_conversation_participants_conversation') THEN
        ALTER TABLE conversation_participants ADD CONSTRAINT fk_conversation_participants_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_conversation_participants_user') THEN
        ALTER TABLE conversation_participants ADD CONSTRAINT fk_conversation_participants_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_applications_user') THEN
        ALTER TABLE applications ADD CONSTRAINT fk_applications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_applications_opportunity') THEN
        ALTER TABLE applications ADD CONSTRAINT fk_applications_opportunity FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_favorites_user') THEN
        ALTER TABLE favorites ADD CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_favorites_opportunity') THEN
        ALTER TABLE favorites ADD CONSTRAINT fk_favorites_opportunity FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_opportunities_creator') THEN
        ALTER TABLE opportunities ADD CONSTRAINT fk_opportunities_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_reports_reporter') THEN
        ALTER TABLE reports ADD CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_reports_reviewer') THEN
        ALTER TABLE reports ADD CONSTRAINT fk_reports_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_profiles_user') THEN
        ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_settings_user') THEN
        ALTER TABLE user_settings ADD CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_password_reset_tokens_user') THEN
        ALTER TABLE password_reset_tokens ADD CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_conversations_creator') THEN
        ALTER TABLE conversations ADD CONSTRAINT fk_conversations_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers for tables that need them
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_communities_updated_at ON communities;
CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add function to automatically update member_count and post_count
CREATE OR REPLACE FUNCTION update_community_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'community_members' THEN
            UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
        ELSIF TG_TABLE_NAME = 'posts' AND NEW.community_id IS NOT NULL THEN
            UPDATE communities SET post_count = post_count + 1 WHERE id = NEW.community_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'community_members' THEN
            UPDATE communities SET member_count = member_count - 1 WHERE id = OLD.community_id;
        ELSIF TG_TABLE_NAME = 'posts' AND OLD.community_id IS NOT NULL THEN
            UPDATE communities SET post_count = post_count - 1 WHERE id = OLD.community_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Add triggers for automatic count updates
DROP TRIGGER IF EXISTS update_community_member_count ON community_members;
CREATE TRIGGER update_community_member_count AFTER INSERT OR DELETE ON community_members FOR EACH ROW EXECUTE FUNCTION update_community_counts();

DROP TRIGGER IF EXISTS update_community_post_count ON posts;
CREATE TRIGGER update_community_post_count AFTER INSERT OR DELETE ON posts FOR EACH ROW EXECUTE FUNCTION update_community_counts();

-- Add function to automatically update likes_count and comments_count
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'likes' THEN
            UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        ELSIF TG_TABLE_NAME = 'comments' THEN
            UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'likes' THEN
            UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        ELSIF TG_TABLE_NAME = 'comments' THEN
            UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Add triggers for automatic post count updates
DROP TRIGGER IF EXISTS update_post_likes_count ON likes;
CREATE TRIGGER update_post_likes_count AFTER INSERT OR DELETE ON likes FOR EACH ROW EXECUTE FUNCTION update_post_counts();

DROP TRIGGER IF EXISTS update_post_comments_count ON comments;
CREATE TRIGGER update_post_comments_count AFTER INSERT OR DELETE ON comments FOR EACH ROW EXECUTE FUNCTION update_post_counts();
