-- Add about column to profiles table
-- This script should be executed in the Supabase Dashboard SQL Editor

-- Add about column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS about TEXT DEFAULT 'I love connecting with travelers and sharing unique experiences.';

-- Comment explaining column
COMMENT ON COLUMN public.profiles.about IS 'User bio/about information displayed on profile and listings';
