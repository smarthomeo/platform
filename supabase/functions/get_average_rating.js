
// This is a placeholder to remind the user to create this function in the Supabase SQL editor
// The actual SQL is:
/*
CREATE OR REPLACE FUNCTION get_average_rating(p_listing_id TEXT, p_listing_type TEXT)
RETURNS FLOAT AS $$
DECLARE
  avg_rating FLOAT;
BEGIN
  SELECT AVG(rating)::FLOAT INTO avg_rating
  FROM reviews
  WHERE listing_id = p_listing_id AND listing_type = p_listing_type;
  
  RETURN COALESCE(avg_rating, 0);
END;
$$ LANGUAGE plpgsql;
*/
