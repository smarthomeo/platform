-- Migration: Create utility functions
-- This script creates useful PostgreSQL functions for the platform

-- Function to get nearby food experiences based on coordinates
CREATE OR REPLACE FUNCTION public.nearby_food_experiences(
  lat DECIMAL,
  lng DECIMAL,
  radius_km DECIMAL DEFAULT 10,
  max_results INTEGER DEFAULT 50
)
RETURNS SETOF public.food_experiences
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.food_experiences
  WHERE status = 'published'
  AND (
    6371 * acos(
      cos(radians(lat)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(lng)) +
      sin(radians(lat)) * sin(radians(latitude))
    )
  ) <= radius_km
  ORDER BY (
    6371 * acos(
      cos(radians(lat)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(lng)) +
      sin(radians(lat)) * sin(radians(latitude))
    )
  )
  LIMIT max_results;
$$;

-- Function to get nearby stays based on coordinates
CREATE OR REPLACE FUNCTION public.nearby_stays(
  lat DECIMAL,
  lng DECIMAL,
  radius_km DECIMAL DEFAULT 10,
  max_results INTEGER DEFAULT 50
)
RETURNS SETOF public.stays
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.stays
  WHERE status = 'published'
  AND (
    6371 * acos(
      cos(radians(lat)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(lng)) +
      sin(radians(lat)) * sin(radians(latitude))
    )
  ) <= radius_km
  ORDER BY (
    6371 * acos(
      cos(radians(lat)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(lng)) +
      sin(radians(lat)) * sin(radians(latitude))
    )
  )
  LIMIT max_results;
$$;

-- Function to check availability for food experiences
CREATE OR REPLACE FUNCTION public.check_food_experience_availability(
  experience_id UUID,
  requested_date DATE,
  guests INTEGER DEFAULT 1
)
RETURNS TABLE (
  availability_id UUID,
  start_time TIME,
  end_time TIME,
  available_spots INTEGER
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id AS availability_id,
    start_time,
    end_time,
    available_spots
  FROM public.food_experience_availability
  WHERE experience_id = check_food_experience_availability.experience_id
  AND date = requested_date
  AND is_available = TRUE
  AND available_spots >= guests
  ORDER BY start_time;
$$;

-- Function to check availability for stays
CREATE OR REPLACE FUNCTION public.check_stay_availability(
  stay_id UUID,
  check_in DATE,
  check_out DATE
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.stay_availability
    WHERE stay_id = check_stay_availability.stay_id
    AND date >= check_in
    AND date < check_out
    AND is_available = FALSE
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.stay_bookings
    WHERE stay_id = check_stay_availability.stay_id
    AND status = 'confirmed'
    AND (
      (check_in_date <= check_in AND check_out_date > check_in) OR
      (check_in_date < check_out AND check_out_date >= check_out) OR
      (check_in_date >= check_in AND check_out_date <= check_out)
    )
  );
$$;

-- Function to calculate the price for a stay booking
CREATE OR REPLACE FUNCTION public.calculate_stay_booking_price(
  stay_id UUID,
  check_in DATE,
  check_out DATE
)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  total_price DECIMAL := 0;
  base_price DECIMAL;
  current_day DATE := check_in;
  daily_price DECIMAL;
BEGIN
  -- Get the base price for the stay
  SELECT price_per_night INTO base_price
  FROM public.stays
  WHERE id = stay_id;
  
  -- Iterate through each day and calculate price
  WHILE current_day < check_out LOOP
    -- Check if there's a price override for this date
    SELECT COALESCE(price_override, base_price) INTO daily_price
    FROM public.stay_availability
    WHERE stay_id = calculate_stay_booking_price.stay_id
    AND date = current_day;
    
    -- If no specific entry, use base price
    IF daily_price IS NULL THEN
      daily_price := base_price;
    END IF;
    
    total_price := total_price + daily_price;
    current_day := current_day + INTERVAL '1 day';
  END LOOP;
  
  RETURN total_price;
END;
$$;

-- Function to get food experiences by host
CREATE OR REPLACE FUNCTION public.get_host_food_experiences(host_id UUID)
RETURNS SETOF public.food_experiences
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.food_experiences
  WHERE host_id = get_host_food_experiences.host_id
  ORDER BY created_at DESC;
$$;

-- Function to get stays by host
CREATE OR REPLACE FUNCTION public.get_host_stays(host_id UUID)
RETURNS SETOF public.stays
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.stays
  WHERE host_id = get_host_stays.host_id
  ORDER BY created_at DESC;
$$;

-- Function to update the profile 'is_host' status based on listings
CREATE OR REPLACE FUNCTION public.update_host_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a user creates their first food experience or stay, 
  -- automatically set them as a host if they aren't already
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = NEW.host_id AND is_host = TRUE
  ) THEN
    UPDATE public.profiles
    SET is_host = TRUE,
        updated_at = now()
    WHERE id = NEW.host_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers for the host status update function
CREATE TRIGGER update_host_status_food_experience
  AFTER INSERT ON public.food_experiences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_host_status();

CREATE TRIGGER update_host_status_stay
  AFTER INSERT ON public.stays
  FOR EACH ROW
  EXECUTE FUNCTION public.update_host_status();

-- Add comments for documentation
COMMENT ON FUNCTION public.nearby_food_experiences IS 'Finds food experiences within a specified radius of coordinates';
COMMENT ON FUNCTION public.nearby_stays IS 'Finds stays within a specified radius of coordinates';
COMMENT ON FUNCTION public.check_food_experience_availability IS 'Checks available slots for a food experience on a specific date';
COMMENT ON FUNCTION public.check_stay_availability IS 'Checks if a stay is available for a date range';
COMMENT ON FUNCTION public.calculate_stay_booking_price IS 'Calculates the total price for a stay booking with possible date-specific pricing';
COMMENT ON FUNCTION public.update_host_status IS 'Updates a user to host status when they create their first listing'; 