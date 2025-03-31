-- Fix database issues
BEGIN;

-- 1. Add comment column to reviews table if it doesn't exist (alias for content)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'comment'
  ) THEN
    ALTER TABLE reviews ADD COLUMN comment TEXT GENERATED ALWAYS AS (content) STORED;
  END IF;
END $$;

-- 2. Add listing_id and listing_type columns to favorites table (alias for item_id and item_type)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'favorites' AND column_name = 'listing_id'
  ) THEN
    ALTER TABLE favorites ADD COLUMN listing_id UUID GENERATED ALWAYS AS (item_id) STORED;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'favorites' AND column_name = 'listing_type'
  ) THEN
    ALTER TABLE favorites ADD COLUMN listing_type TEXT GENERATED ALWAYS AS (item_type) STORED;
  END IF;
END $$;

-- 3. Add user_id column to reviews table (alias for author_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN user_id UUID GENERATED ALWAYS AS (author_id) STORED;
  END IF;
END $$;

-- 4. Fix the bucket policy for food-experience-images
DO $$
DECLARE
    bucket_id UUID;
BEGIN
    -- Get the bucket_id for food-experience-images
    SELECT id INTO bucket_id 
    FROM storage.buckets 
    WHERE name = 'food-experience-images';
    
    IF bucket_id IS NULL THEN
        RAISE NOTICE 'Bucket not found, skipping policy creation';
        RETURN;
    END IF;
    
    -- Delete existing policies
    DELETE FROM storage.policies WHERE bucket_id = bucket_id;
    
    -- Insert new policies
    INSERT INTO storage.policies (name, bucket_id, definition)
    VALUES ('Allow public read access', 
            bucket_id, 
            '{"rowSecurity": true, "statements": [{"operation": "SELECT", "effect": "ALLOW", "roles": ["anon", "authenticated"]}]}');
    
    INSERT INTO storage.policies (name, bucket_id, definition)
    VALUES ('Allow authenticated users to upload', 
            bucket_id, 
            '{"rowSecurity": true, "statements": [{"operation": "INSERT", "effect": "ALLOW", "roles": ["authenticated"]}]}');
            
    INSERT INTO storage.policies (name, bucket_id, definition)
    VALUES ('Allow authenticated users to update and delete', 
            bucket_id, 
            '{"rowSecurity": true, "statements": [{"operation": "UPDATE", "effect": "ALLOW", "roles": ["authenticated"]}, {"operation": "DELETE", "effect": "ALLOW", "roles": ["authenticated"]}]}');
END $$;

-- 5. Create RLS policy for food_experience_images to allow uploads
CREATE OR REPLACE FUNCTION get_owner_id_for_experience(experience_id UUID)
RETURNS UUID AS $$
DECLARE
    host_id UUID;
BEGIN
    SELECT fe.host_id INTO host_id
    FROM food_experiences fe
    WHERE fe.id = experience_id;
    
    RETURN host_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate objects policy
DO $$
DECLARE
    food_images_bucket_id UUID;
BEGIN
    -- Get the bucket_id safely
    SELECT id INTO food_images_bucket_id
    FROM storage.buckets
    WHERE name = 'food-experience-images';
    
    IF food_images_bucket_id IS NULL THEN
        RAISE NOTICE 'Bucket ''food-experience-images'' not found, skipping object policy';
        RETURN;
    END IF;
    
    -- Drop the policy if it exists
    BEGIN
        DROP POLICY IF EXISTS "Allow hosts to upload images" ON storage.objects;
    EXCEPTION
        WHEN OTHERS THEN 
            RAISE NOTICE 'Error dropping policy: %', SQLERRM;
    END;
    
    -- Create the policy
    EXECUTE format('
        CREATE POLICY "Allow hosts to upload images" 
        ON storage.objects 
        FOR INSERT 
        TO authenticated
        WITH CHECK (
            bucket_id = %L
        )
    ', food_images_bucket_id);
END$$;

-- Fix the food_experience_images RLS policy
DROP POLICY IF EXISTS "Hosts can manage food experience images" ON food_experience_images;
CREATE POLICY "Hosts can manage food experience images" 
ON food_experience_images
FOR ALL
TO authenticated
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

COMMIT; 