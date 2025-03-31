-- Main Migration File for Platform2025
-- Run this file in the Supabase SQL Editor to set up the complete database schema

-- Begin transaction to ensure all migrations run as a single unit
BEGIN;

-- Comments to document the migration process
COMMENT ON SCHEMA public IS 'Platform2025 - Food experiences and stays platform';

-- Note: The profiles table should already be created and linked with Supabase Auth
-- If not already done, run create-profiles-table.sql first

-- Add is_admin column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create the basic tables
\i 'platform/migrations/create-remaining-tables.sql'

-- Create favorites table
\i 'platform/migrations/create-favorites-table.sql'

-- Set up RLS policies for all tables
\i 'platform/migrations/create-rls-policies.sql'

-- Create utility functions
\i 'platform/migrations/create-functions.sql'

-- Initial setup for admin user(s) - uncomment and modify as needed
/*
-- Add admin flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Set a specific user as admin (replace with actual user ID)
-- UPDATE public.profiles SET is_admin = TRUE WHERE id = '00000000-0000-0000-0000-000000000000';
*/

-- Initial seed data for amenities
INSERT INTO public.amenities (name, category, type) VALUES
-- Stay amenities
('WiFi', 'Basic', 'stay'),
('Kitchen', 'Basic', 'stay'),
('Free parking', 'Basic', 'stay'),
('Pool', 'Featured', 'stay'),
('Hot tub', 'Featured', 'stay'),
('Air conditioning', 'Basic', 'stay'),
('Heating', 'Basic', 'stay'),
('Washer', 'Utilities', 'stay'),
('Dryer', 'Utilities', 'stay'),
('TV', 'Entertainment', 'stay'),
('Gym', 'Featured', 'stay'),
('Wheelchair accessible', 'Accessibility', 'stay'),

-- Food Experience amenities
('Vegetarian options', 'Dietary', 'food'),
('Vegan options', 'Dietary', 'food'),
('Gluten-free options', 'Dietary', 'food'),
('Halal', 'Dietary', 'food'),
('Kosher', 'Dietary', 'food'),
('Alcohol provided', 'Beverages', 'food'),
('BYO alcohol', 'Beverages', 'food'),
('Private dining room', 'Space', 'food'),
('Outdoor dining', 'Space', 'food'),
('Pet-friendly', 'Space', 'both'),
('Family-friendly', 'Type', 'both'),
('Wheelchair accessible', 'Accessibility', 'food')

ON CONFLICT DO NOTHING;

-- Commit the transaction
COMMIT;

-- Final check
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
END $$; 