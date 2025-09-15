-- Add onboarding fields to user_profiles table
-- This migration adds fields for storing user onboarding questionnaire data

-- Add new columns to user_profiles table (PostgreSQL)
ALTER TABLE user_profiles ADD COLUMN age_range TEXT;
ALTER TABLE user_profiles ADD COLUMN field_of_study TEXT; -- JSON array of selected fields
ALTER TABLE user_profiles ADD COLUMN academic_level TEXT;
ALTER TABLE user_profiles ADD COLUMN university TEXT;
ALTER TABLE user_profiles ADD COLUMN preferences TEXT; -- JSON array of user preferences
ALTER TABLE user_profiles ADD COLUMN onboarding_completed INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN onboarding_completed_at TIMESTAMP;
