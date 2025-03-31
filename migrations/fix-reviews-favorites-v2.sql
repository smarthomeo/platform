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

-- 4. Fix the RLS policies for storage objects
DO $$
BEGIN
    -- Create policy directly on storage.objects 
    BEGIN
        DROP POLICY IF EXISTS "Allow public access to food experience images" ON storage.objects;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Error dropping policy: %', SQLERRM;
    END;
    
    BEGIN
        CREATE POLICY "Allow public access to food experience images" 
        ON storage.objects 
        FOR SELECT
        TO public
        USING (bucket_id = 'food-experience-images');
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Error creating select policy: %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow authenticated users to upload food experience images" ON storage.objects;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Error dropping policy: %', SQLERRM;
    END;
    
    BEGIN
        CREATE POLICY "Allow authenticated users to upload food experience images" 
        ON storage.objects 
        FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'food-experience-images');
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Error creating insert policy: %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow authenticated users to update food experience images" ON storage.objects;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Error dropping policy: %', SQLERRM;
    END;
    
    BEGIN
        CREATE POLICY "Allow authenticated users to update food experience images" 
        ON storage.objects 
        FOR UPDATE
        TO authenticated
        USING (bucket_id = 'food-experience-images')
        WITH CHECK (bucket_id = 'food-experience-images');
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Error creating update policy: %', SQLERRM;
    END;
    
    BEGIN
        DROP POLICY IF EXISTS "Allow authenticated users to delete food experience images" ON storage.objects;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Error dropping policy: %', SQLERRM;
    END;
    
    BEGIN
        CREATE POLICY "Allow authenticated users to delete food experience images" 
        ON storage.objects 
        FOR DELETE
        TO authenticated
        USING (bucket_id = 'food-experience-images');
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Error creating delete policy: %', SQLERRM;
    END;
END $$;

-- 5. Fix the food_experience_images RLS policy
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

-- 6. Create or replace the published food experiences policy
DROP POLICY IF EXISTS "Published food experiences are viewable by everyone" ON food_experiences;
CREATE POLICY "Published food experiences are viewable by everyone"
ON food_experiences
FOR SELECT 
TO public
USING (status = 'published');

-- 7. Create or replace the draft food experiences policy for hosts
DROP POLICY IF EXISTS "Draft food experiences are viewable by the owner" ON food_experiences;
CREATE POLICY "Draft food experiences are viewable by the owner"
ON food_experiences
FOR SELECT
TO authenticated
USING (status != 'published' AND host_id = auth.uid());

COMMIT; 