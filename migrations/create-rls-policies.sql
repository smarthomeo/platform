-- Migration: Create RLS policies for all tables
-- This script should be run after creating all tables

-- RLS for Stays
ALTER TABLE public.stays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published stays are viewable by everyone"
ON public.stays FOR SELECT
USING (status = 'published');

CREATE POLICY "Hosts can manage their own stays"
ON public.stays FOR ALL
USING (host_id = auth.uid());

-- RLS for Stay Images
ALTER TABLE public.stay_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stay images are viewable by everyone"
ON public.stay_images FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.stays
  WHERE id = stay_images.stay_id AND status = 'published'
));

CREATE POLICY "Hosts can manage their own stay images"
ON public.stay_images FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.stays
  WHERE id = stay_images.stay_id AND host_id = auth.uid()
));

-- RLS for Stay Availability
ALTER TABLE public.stay_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stay availability is viewable by everyone"
ON public.stay_availability FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.stays
  WHERE id = stay_availability.stay_id AND status = 'published'
));

CREATE POLICY "Hosts can manage their own stay availability"
ON public.stay_availability FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.stays
  WHERE id = stay_availability.stay_id AND host_id = auth.uid()
));

-- RLS for Stay Amenities
ALTER TABLE public.stay_amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stay amenities are viewable by everyone"
ON public.stay_amenities FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.stays
  WHERE id = stay_amenities.stay_id AND status = 'published'
));

CREATE POLICY "Hosts can manage their own stay amenities"
ON public.stay_amenities FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.stays
  WHERE id = stay_amenities.stay_id AND host_id = auth.uid()
));

-- RLS for Food Experience Availability
ALTER TABLE public.food_experience_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Food experience availability is viewable by everyone"
ON public.food_experience_availability FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.food_experiences
  WHERE id = food_experience_availability.experience_id AND status = 'published'
));

CREATE POLICY "Hosts can manage their own food experience availability"
ON public.food_experience_availability FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.food_experiences
  WHERE id = food_experience_availability.experience_id AND host_id = auth.uid()
));

-- RLS for Food Experience Amenities
ALTER TABLE public.food_experience_amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Food experience amenities are viewable by everyone"
ON public.food_experience_amenities FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.food_experiences
  WHERE id = food_experience_amenities.experience_id AND status = 'published'
));

CREATE POLICY "Hosts can manage their own food experience amenities"
ON public.food_experience_amenities FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.food_experiences
  WHERE id = food_experience_amenities.experience_id AND host_id = auth.uid()
));

-- RLS for Amenities (global reference table)
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Amenities are viewable by everyone"
ON public.amenities FOR SELECT
USING (true);

-- Replace the policy that uses is_admin which doesn't exist
DROP POLICY IF EXISTS "Only admins can manage amenities" ON public.amenities;

-- Create a more permissive policy for now (you can restrict this later after adding is_admin column)
CREATE POLICY "Authenticated users can manage amenities"
ON public.amenities FOR ALL
USING (auth.uid() IS NOT NULL);

-- RLS for Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reviews"
ON public.reviews FOR INSERT
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own reviews"
ON public.reviews FOR DELETE
USING (author_id = auth.uid());

-- RLS for Food Experience Bookings
ALTER TABLE public.food_experience_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own food experience bookings"
ON public.food_experience_bookings FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Hosts can view bookings for their experiences"
ON public.food_experience_bookings FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.food_experiences
  WHERE id = food_experience_bookings.experience_id AND host_id = auth.uid()
));

CREATE POLICY "Users can create their own food experience bookings"
ON public.food_experience_bookings FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own food experience bookings"
ON public.food_experience_bookings FOR UPDATE
USING (user_id = auth.uid());

-- RLS for Stay Bookings
ALTER TABLE public.stay_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stay bookings"
ON public.stay_bookings FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Hosts can view bookings for their stays"
ON public.stay_bookings FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.stays
  WHERE id = stay_bookings.stay_id AND host_id = auth.uid()
));

CREATE POLICY "Users can create their own stay bookings"
ON public.stay_bookings FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own stay bookings"
ON public.stay_bookings FOR UPDATE
USING (user_id = auth.uid());