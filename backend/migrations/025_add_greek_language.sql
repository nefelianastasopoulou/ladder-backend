-- Add Greek language support to user_settings constraint
-- This migration updates the language constraint to include 'el' (Greek)

-- Drop the existing constraint
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS check_language_valid;

-- Add the new constraint with Greek language support
ALTER TABLE user_settings ADD CONSTRAINT check_language_valid 
CHECK (language IN ('en', 'el', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'));

