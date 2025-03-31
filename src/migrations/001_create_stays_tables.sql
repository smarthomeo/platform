-- Create stays tables and relationships

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create stays table
CREATE TABLE IF NOT EXISTS public.stays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_per_night NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  property_type TEXT,
  bedrooms INT NOT NULL DEFAULT 1,
  beds INT NOT NULL DEFAULT 1,
  bathrooms INT NOT NULL DEFAULT 1,
  max_guests INT NOT NULL DEFAULT 2,
  amenities TEXT[] DEFAULT ARRAY['Wi-Fi']::TEXT[],
  location TEXT NOT NULL,
  zipcode TEXT,
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create stay images table
CREATE TABLE IF NOT EXISTS public.stay_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stay_id UUID NOT NULL REFERENCES public.stays(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create stay availability table
CREATE TABLE IF NOT EXISTS public.stay_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stay_id UUID NOT NULL REFERENCES public.stays(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(stay_id, date)
);

-- Create stay reviews table
CREATE TABLE IF NOT EXISTS public.stay_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stay_id UUID NOT NULL REFERENCES public.stays(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(stay_id, user_id)
);

-- Create user favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stay_id UUID NOT NULL REFERENCES public.stays(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, stay_id)
);

-- Create stay bookings table
CREATE TABLE IF NOT EXISTS public.stay_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stay_id UUID NOT NULL REFERENCES public.stays(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date > start_date),
  num_guests INT NOT NULL DEFAULT 1,
  total_price NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled, completed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating updated_at timestamps
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.stays
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.stay_availability
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.stay_reviews
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.stay_bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS stays_host_id_idx ON public.stays(host_id);
CREATE INDEX IF NOT EXISTS stays_property_type_idx ON public.stays(property_type);
CREATE INDEX IF NOT EXISTS stays_status_idx ON public.stays(status);
CREATE INDEX IF NOT EXISTS stays_zipcode_idx ON public.stays(zipcode);
CREATE INDEX IF NOT EXISTS stays_location_idx ON public.stays(location);
CREATE INDEX IF NOT EXISTS stays_is_featured_idx ON public.stays(is_featured);

CREATE INDEX IF NOT EXISTS stay_images_stay_id_idx ON public.stay_images(stay_id);
CREATE INDEX IF NOT EXISTS stay_availability_stay_id_date_idx ON public.stay_availability(stay_id, date);
CREATE INDEX IF NOT EXISTS stay_reviews_stay_id_idx ON public.stay_reviews(stay_id);
CREATE INDEX IF NOT EXISTS stay_reviews_user_id_idx ON public.stay_reviews(user_id);
CREATE INDEX IF NOT EXISTS user_favorites_user_id_idx ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS user_favorites_stay_id_idx ON public.user_favorites(stay_id);
CREATE INDEX IF NOT EXISTS stay_bookings_stay_id_idx ON public.stay_bookings(stay_id);
CREATE INDEX IF NOT EXISTS stay_bookings_user_id_idx ON public.stay_bookings(user_id);
CREATE INDEX IF NOT EXISTS stay_bookings_status_idx ON public.stay_bookings(status);

-- Set up Row Level Security (RLS) policies
ALTER TABLE public.stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stay_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stay_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stay_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stay_bookings ENABLE ROW LEVEL SECURITY;

-- Stays policies
CREATE POLICY "Anyone can view published stays"
  ON public.stays FOR SELECT
  USING (status = 'published');

CREATE POLICY "Hosts can manage their own stays"
  ON public.stays FOR ALL
  USING (auth.uid() = host_id);

-- Stay images policies
CREATE POLICY "Anyone can view stay images"
  ON public.stay_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Hosts can manage their own stay images"
  ON public.stay_images FOR ALL
  USING (
    auth.uid() IN (
      SELECT host_id FROM public.stays 
      WHERE id = stay_id
    )
  );

-- Stay availability policies
CREATE POLICY "Anyone can view stay availability"
  ON public.stay_availability FOR SELECT
  USING (true);

CREATE POLICY "Hosts can manage their own stay availability"
  ON public.stay_availability FOR ALL
  USING (
    auth.uid() IN (
      SELECT host_id FROM public.stays 
      WHERE id = stay_id
    )
  );

-- Stay reviews policies
CREATE POLICY "Anyone can view stay reviews"
  ON public.stay_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own reviews"
  ON public.stay_reviews FOR ALL
  USING (auth.uid() = user_id);

-- User favorites policies
CREATE POLICY "Users can view their own favorites"
  ON public.user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites"
  ON public.user_favorites FOR ALL
  USING (auth.uid() = user_id);

-- Stay bookings policies
CREATE POLICY "Users can view their own bookings"
  ON public.stay_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Hosts can view bookings for their stays"
  ON public.stay_bookings FOR SELECT
  USING (
    auth.uid() IN (
      SELECT host_id FROM public.stays 
      WHERE id = stay_id
    )
  );

CREATE POLICY "Users can insert their own bookings"
  ON public.stay_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending or confirmed bookings"
  ON public.stay_bookings FOR UPDATE
  USING (
    auth.uid() = user_id AND
    status IN ('pending', 'confirmed')
  ); 