-- Migration: Add synchronization between profiles and auth users
-- This script needs to be executed in the Supabase Dashboard SQL Editor

-- Improved function to handle new user creation and sync metadata more completely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, is_host)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'picture', NEW.raw_user_meta_data->>'avatar_url'),
    COALESCE((NEW.raw_user_meta_data->>'is_host')::boolean, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to sync profile updates back to auth.users
CREATE OR REPLACE FUNCTION public.sync_profile_to_auth()
RETURNS TRIGGER AS $$
DECLARE
  v_user_data jsonb;
BEGIN
  -- Get the current user metadata
  SELECT raw_user_meta_data INTO v_user_data FROM auth.users WHERE id = NEW.id;
  
  -- Update metadata with the new profile values
  v_user_data := jsonb_set(v_user_data, '{name}', to_jsonb(NEW.name));
  v_user_data := jsonb_set(v_user_data, '{full_name}', to_jsonb(NEW.name));
  v_user_data := jsonb_set(v_user_data, '{is_host}', to_jsonb(NEW.is_host));
  
  -- Only update avatar if it's not null
  IF NEW.avatar_url IS NOT NULL THEN
    v_user_data := jsonb_set(v_user_data, '{picture}', to_jsonb(NEW.avatar_url));
    v_user_data := jsonb_set(v_user_data, '{avatar_url}', to_jsonb(NEW.avatar_url));
  END IF;
  
  -- Update the auth.users table
  UPDATE auth.users SET raw_user_meta_data = v_user_data WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync profile updates to auth.users
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_auth();

-- Create a function to sync auth user metadata updates to profiles
CREATE OR REPLACE FUNCTION public.sync_auth_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if we already have a profile for this user
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    UPDATE public.profiles
    SET 
      name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', name),
      avatar_url = COALESCE(NEW.raw_user_meta_data->>'picture', NEW.raw_user_meta_data->>'avatar_url', avatar_url),
      is_host = COALESCE((NEW.raw_user_meta_data->>'is_host')::boolean, is_host),
      updated_at = now()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync auth updates to profiles
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.sync_auth_to_profile();

-- Comment for users running this script
COMMENT ON FUNCTION public.sync_profile_to_auth() IS 'Automatically updates auth.users metadata when a profile is updated';
COMMENT ON FUNCTION public.sync_auth_to_profile() IS 'Automatically updates profiles when auth.users metadata is updated'; 