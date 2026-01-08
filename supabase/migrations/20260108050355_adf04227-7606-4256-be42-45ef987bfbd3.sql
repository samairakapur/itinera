-- Add profile_complete column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_complete boolean DEFAULT false;