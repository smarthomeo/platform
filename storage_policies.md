# Supabase Storage Bucket Policies

This document outlines the recommended storage bucket policies for the platform.

## User Profiles Bucket Policies

Create a bucket called `user-profiles` with public read access and authenticated write access:

```sql
-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-profiles', 'User Profile Images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload their own profile images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'user-profiles' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to update their own profile images
CREATE POLICY "Users can update their own profile images" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'user-profiles' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own profile images
CREATE POLICY "Users can delete their own profile images" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'user-profiles' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to select/view their own profile images
CREATE POLICY "Users can view their own profile images" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'user-profiles' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to all profile images (since profiles are public)
CREATE POLICY "Public can view all profile images" 
ON storage.objects FOR SELECT 
TO anon 
USING (bucket_id = 'user-profiles');
```

## Stay Images Bucket Policies

Create a bucket called `stay-images` with similar policies:

```sql
-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('stay-images', 'Stay Listing Images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow hosts to upload stay images
-- This policy checks if the user is a host and if they own the stay
CREATE POLICY "Hosts can upload their own stay images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'stay-images' 
  AND EXISTS (
    SELECT 1 FROM stays s
    JOIN profiles p ON p.id = auth.uid()
    WHERE p.is_host = true
    AND s.host_id = auth.uid()
    AND (storage.foldername(name))[1] = s.id::text
  )
);

-- Allow hosts to update their own stay images
CREATE POLICY "Hosts can update their own stay images" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'stay-images' 
  AND EXISTS (
    SELECT 1 FROM stays s
    JOIN profiles p ON p.id = auth.uid()
    WHERE p.is_host = true
    AND s.host_id = auth.uid()
    AND (storage.foldername(name))[1] = s.id::text
  )
);

-- Allow hosts to delete their own stay images
CREATE POLICY "Hosts can delete their own stay images" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'stay-images' 
  AND EXISTS (
    SELECT 1 FROM stays s
    JOIN profiles p ON p.id = auth.uid()
    WHERE p.is_host = true
    AND s.host_id = auth.uid()
    AND (storage.foldername(name))[1] = s.id::text
  )
);

-- Allow anyone to view stay images
CREATE POLICY "Public can view all stay images" 
ON storage.objects FOR SELECT 
TO anon 
USING (bucket_id = 'stay-images');
```

## Food Experience Images Bucket Policies

Create a bucket called `food-experience-images` with similar policies:

```sql
-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('food-experience-images', 'Food Experience Images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow hosts to upload food experience images
CREATE POLICY "Hosts can upload their own food experience images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'food-experience-images' 
  AND EXISTS (
    SELECT 1 FROM food_experiences fe
    JOIN profiles p ON p.id = auth.uid()
    WHERE p.is_host = true
    AND fe.host_id = auth.uid()
    AND (storage.foldername(name))[1] = fe.id::text
  )
);

-- Allow hosts to update their own food experience images
CREATE POLICY "Hosts can update their own food experience images" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'food-experience-images' 
  AND EXISTS (
    SELECT 1 FROM food_experiences fe
    JOIN profiles p ON p.id = auth.uid()
    WHERE p.is_host = true
    AND fe.host_id = auth.uid()
    AND (storage.foldername(name))[1] = fe.id::text
  )
);

-- Allow hosts to delete their own food experience images
CREATE POLICY "Hosts can delete their own food experience images" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'food-experience-images' 
  AND EXISTS (
    SELECT 1 FROM food_experiences fe
    JOIN profiles p ON p.id = auth.uid()
    WHERE p.is_host = true
    AND fe.host_id = auth.uid()
    AND (storage.foldername(name))[1] = fe.id::text
  )
);

-- Allow anyone to view food experience images
CREATE POLICY "Public can view all food experience images" 
ON storage.objects FOR SELECT 
TO anon 
USING (bucket_id = 'food-experience-images');
```

## Implementation Notes

1. The folder structure within each bucket should be organized as follows:
   - `user-profiles/[user_id]/[filename].[ext]`
   - `stay-images/[stay_id]/[filename].[ext]`
   - `food-experience-images/[experience_id]/[filename].[ext]`

2. When implementing image uploads, always ensure the files are placed in the correct folder structure.

3. Set appropriate file size limits:
   - Profile images: Limit to 5MB
   - Stay/Food Experience images: Limit to 10MB

4. Include image validation:
   - Accept only common image formats (jpg, jpeg, png, webp)
   - Consider server-side validation of image dimensions

5. When accessing images, always use the Supabase public URL format:
   ```
   [your-supabase-url]/storage/v1/object/public/[bucket]/[path]
   ``` 