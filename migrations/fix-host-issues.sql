-- Fix RLS policies for storage buckets
BEGIN;

-- Create storage bucket RLS policies for food-experience-images
INSERT INTO storage.policies (name, bucket_id, definition)
SELECT 
  'Public Read Access for Food Experience Images',
  id,
  '{"rowSecurity": true, "statements": [{"operation": "SELECT", "roles": ["public"], "effect": "ALLOW"}]}'::jsonb
FROM storage.buckets 
WHERE name = 'food-experience-images'
AND NOT EXISTS (
  SELECT 1 FROM storage.policies 
  WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'food-experience-images')
  AND name = 'Public Read Access for Food Experience Images'
);

INSERT INTO storage.policies (name, bucket_id, definition)
SELECT 
  'Authenticated Users Can Upload Food Experience Images',
  id,
  '{"rowSecurity": true, "statements": [{"operation": "INSERT", "roles": ["authenticated"], "effect": "ALLOW"}]}'::jsonb
FROM storage.buckets 
WHERE name = 'food-experience-images'
AND NOT EXISTS (
  SELECT 1 FROM storage.policies 
  WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'food-experience-images')
  AND name = 'Authenticated Users Can Upload Food Experience Images'
);

INSERT INTO storage.policies (name, bucket_id, definition)
SELECT 
  'Host Users Can Manage Food Experience Images',
  id,
  '{"rowSecurity": true, "statements": [{"operation": "ALL", "roles": ["authenticated"], "effect": "ALLOW"}]}'::jsonb
FROM storage.buckets 
WHERE name = 'food-experience-images'
AND NOT EXISTS (
  SELECT 1 FROM storage.policies 
  WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'food-experience-images')
  AND name = 'Host Users Can Manage Food Experience Images'
);

-- Fix the RLS policy for food_experience_images to allow hosts to insert new images
DROP POLICY IF EXISTS "Hosts can manage their own food experience images" ON public.food_experience_images;
CREATE POLICY "Hosts can manage their own food experience images" 
ON public.food_experience_images
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM food_experiences 
    WHERE food_experiences.id = food_experience_images.experience_id 
    AND food_experiences.host_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM food_experiences 
    WHERE food_experiences.id = food_experience_images.experience_id 
    AND food_experiences.host_id = auth.uid()
  )
);

-- Fix the RLS policy for food_experiences to make created experiences visible in Food.tsx
DROP POLICY IF EXISTS "Draft food experiences are viewable by the owner" ON public.food_experiences;
CREATE POLICY "Draft food experiences are viewable by the owner" 
ON public.food_experiences
FOR SELECT
TO public
USING (
  (status = 'draft' AND host_id = auth.uid()) OR
  (status = 'archived' AND host_id = auth.uid())
);

-- Ensure profiles is_host field is updated when creating a food_experience
CREATE OR REPLACE FUNCTION public.handle_new_food_experience()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's is_host status to true if they aren't already a host
  UPDATE public.profiles
  SET is_host = TRUE
  WHERE id = NEW.host_id AND (is_host IS NULL OR is_host = FALSE);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_food_experience_created'
  ) THEN
    CREATE TRIGGER on_food_experience_created
    AFTER INSERT ON public.food_experiences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_food_experience();
  END IF;
END
$$;

COMMIT; 