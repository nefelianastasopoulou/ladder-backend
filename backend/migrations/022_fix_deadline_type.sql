-- Migration: Fix deadline column type to allow flexible text input
-- Date: 2025-09-30

-- Change deadline from TIMESTAMP to TEXT to allow flexible formats like "Ongoing", "June 2025", etc.
ALTER TABLE opportunities 
ALTER COLUMN deadline TYPE TEXT;
