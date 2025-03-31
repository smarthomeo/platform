-- Migration: Create favorites table
-- This script creates a table for user favorites

-- Create favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('food_experience', 'stay')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, listing_id, listing_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_listing_id_idx ON public.favorites(listing_id);
CREATE INDEX IF NOT EXISTS favorites_listing_type_idx ON public.favorites(listing_type);

-- Apply Row Level Security
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Only let users see their own favorites
CREATE POLICY "Users can view their own favorites"
ON public.favorites FOR SELECT
USING (user_id = auth.uid());

-- Only let users create their own favorites
CREATE POLICY "Users can create their own favorites"
ON public.favorites FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Only let users delete their own favorites
CREATE POLICY "Users can delete their own favorites"
ON public.favorites FOR DELETE
USING (user_id = auth.uid());

-- Add comments
COMMENT ON TABLE public.favorites IS 'Stores user favorites for food experiences and stays';
COMMENT ON COLUMN public.favorites.listing_id IS 'UUID of the listing (food experience or stay)';
COMMENT ON COLUMN public.favorites.listing_type IS 'Type of listing (food_experience or stay)'; 