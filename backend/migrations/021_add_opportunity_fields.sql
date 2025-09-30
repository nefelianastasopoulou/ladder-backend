-- Migration: Add allow_questions and social_media_urls to opportunities table
-- Date: 2025-09-30

-- Add allow_questions column
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS allow_questions BOOLEAN DEFAULT TRUE;

-- Add social_media_urls column (stored as JSON)
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS social_media_urls TEXT;

-- Add comment for documentation
COMMENT ON COLUMN opportunities.allow_questions IS 'Whether users can ask questions about this opportunity';
COMMENT ON COLUMN opportunities.social_media_urls IS 'JSON array of social media URLs for the opportunity';
