-- Delete ALL users from Supabase Auth (fresh start)
-- WARNING: This removes every user. Profiles will be deleted automatically (CASCADE).
-- Run in Supabase SQL Editor.

DELETE FROM auth.users;
