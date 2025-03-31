# Database Setup Guide for Platform

This guide explains how to set up the database tables for the Platform application, particularly focusing on fixing the missing display name issue for email sign-ups.

## Setting Up the Profiles Table

Follow these steps to create the profiles table and configure automatic profile creation when users sign up:

1. Log in to your Supabase dashboard
2. Select your project
3. Navigate to the SQL Editor
4. Create a new query
5. Copy and paste the following SQL:

```sql
-- Create the profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  is_host BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create an index on the id column for faster lookups
CREATE INDEX IF NOT EXISTS profiles_id_idx ON public.profiles(id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, is_host)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'is_host')::boolean, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create a profile when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

6. Click "Run" to execute the query

## Fill Missing Display Names for Existing Users

If you have existing users with missing display names, you can run this SQL query to fix them:

```sql
-- Update missing display names in user_metadata for existing users
UPDATE auth.users
SET raw_user_meta_data = 
  raw_user_meta_data || 
  jsonb_build_object(
    'name', 
    COALESCE(
      raw_user_meta_data->>'name',
      raw_user_meta_data->>'full_name',
      split_part(email, '@', 1)
    )
  )
WHERE raw_user_meta_data->>'name' IS NULL;

-- Synchronize profiles table with updated metadata
INSERT INTO public.profiles (id, name, is_host, created_at, updated_at)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', 'User'), 
  COALESCE((raw_user_meta_data->>'is_host')::boolean, false),
  NOW(),
  NOW()
FROM auth.users
ON CONFLICT (id) 
DO UPDATE SET 
  name = EXCLUDED.name,
  updated_at = NOW();
```

## Verification

To verify that everything is set up correctly:

1. Create a new user using the sign-up form
2. Check the Supabase auth.users table to ensure the name is in the user_metadata
3. Verify that a corresponding entry was created in the profiles table
4. Test Google OAuth sign-in to ensure it also properly stores the display name

## Notes

- The application now extracts display names from both the `name` and `full_name` fields in user_metadata
- Google OAuth stores the name in `user_metadata.name` by default
- Email sign-up now explicitly sets both `name` and `full_name` fields in user_metadata
- The database trigger automatically creates profile entries, eliminating the need for manual creation 