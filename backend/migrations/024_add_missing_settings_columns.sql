-- Add missing columns to user_settings table
-- This ensures all required columns exist for the settings API

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add language column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' AND column_name = 'language'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN language VARCHAR(10) DEFAULT 'en';
    END IF;

    -- Add show_activity_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' AND column_name = 'show_activity_status'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN show_activity_status BOOLEAN DEFAULT TRUE;
    END IF;

    -- Add push_notifications column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' AND column_name = 'push_notifications'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN push_notifications BOOLEAN DEFAULT TRUE;
    END IF;

    -- Add email_notifications column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' AND column_name = 'email_notifications'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN email_notifications BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Update existing records to have default values for new columns
UPDATE user_settings 
SET 
    language = COALESCE(language, 'en'),
    show_activity_status = COALESCE(show_activity_status, TRUE),
    push_notifications = COALESCE(push_notifications, TRUE),
    email_notifications = COALESCE(email_notifications, TRUE)
WHERE 
    language IS NULL 
    OR show_activity_status IS NULL 
    OR push_notifications IS NULL 
    OR email_notifications IS NULL;
