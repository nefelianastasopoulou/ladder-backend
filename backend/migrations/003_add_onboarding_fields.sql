-- Add onboarding fields to user_profiles table
-- This migration adds fields for storing user onboarding questionnaire data

-- Add new columns to user_profiles table (PostgreSQL) - only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'age_range') THEN
        ALTER TABLE user_profiles ADD COLUMN age_range TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'field_of_study') THEN
        ALTER TABLE user_profiles ADD COLUMN field_of_study TEXT; -- JSON array of selected fields
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'academic_level') THEN
        ALTER TABLE user_profiles ADD COLUMN academic_level TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'university') THEN
        ALTER TABLE user_profiles ADD COLUMN university TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'preferences') THEN
        ALTER TABLE user_profiles ADD COLUMN preferences TEXT; -- JSON array of user preferences
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE user_profiles ADD COLUMN onboarding_completed INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'onboarding_completed_at') THEN
        ALTER TABLE user_profiles ADD COLUMN onboarding_completed_at TIMESTAMP;
    END IF;
END $$;
