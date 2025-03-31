-- Migration: Add is_admin column to profiles table
-- Run this when you're ready to implement proper admin permissions

-- Add admin flag to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON public.profiles(is_admin);

-- Update RLS policy for amenities to restrict management to admins
-- Only run this after you've set up at least one admin user
/*
DROP POLICY IF EXISTS "Authenticated users can manage amenities" ON public.amenities;

CREATE POLICY "Only admins can manage amenities"
ON public.amenities FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() AND is_admin = TRUE
));
*/

-- Example: Set a specific user as admin (replace with actual user ID)
-- UPDATE public.profiles SET is_admin = TRUE WHERE id = '00000000-0000-0000-0000-000000000000';

COMMENT ON COLUMN public.profiles.is_admin IS 'Flag indicating if user has admin privileges'; 