-- Promote ONE existing OREOBET profile to admin.
-- Replace YOUR_USERNAME_HERE with the exact username.
-- Run this in Supabase SQL Editor.

DO $$
DECLARE
  target_count integer;
BEGIN
  SELECT count(*) INTO target_count
  FROM public.profiles
  WHERE lower(username) = lower(trim('YOUR_USERNAME_HERE'));

  IF target_count = 0 THEN
    RAISE EXCEPTION 'User not found: YOUR_USERNAME_HERE';
  ELSIF target_count > 1 THEN
    RAISE EXCEPTION 'More than one matching username found';
  END IF;

  UPDATE public.profiles
  SET is_admin = true
  WHERE lower(username) = lower(trim('YOUR_USERNAME_HERE'));
END $$;
