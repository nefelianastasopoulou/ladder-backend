-- Migration: Support multiple categories for opportunities
-- Date: 2026-03-04
-- Changes category column from VARCHAR(100) to TEXT to support JSON array storage

-- Change category column to TEXT to support JSON arrays
ALTER TABLE opportunities 
ALTER COLUMN category TYPE TEXT;

-- Add comment for documentation
COMMENT ON COLUMN opportunities.category IS 'JSON array of categories for the opportunity, or single category string for backward compatibility';
