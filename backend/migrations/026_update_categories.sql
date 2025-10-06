-- Update existing opportunities to use new category names
-- This migration updates the category field to match the new frontend categories

-- Update Events to Events & Conferences
UPDATE opportunities 
SET category = 'Events & Conferences' 
WHERE category = 'Events';

-- Update Conferences to Events & Conferences (merge them)
UPDATE opportunities 
SET category = 'Events & Conferences' 
WHERE category = 'Conferences';

-- Note: Seminars is a new category, so no existing data needs to be updated
