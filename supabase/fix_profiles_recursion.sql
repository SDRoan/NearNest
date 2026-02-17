-- Fix: "infinite recursion detected in policy for relation 'profiles'"
-- The profiles_select_nearby policy referenced profiles in its subquery, causing recursion.
-- Use a SECURITY DEFINER function instead.

-- Drop the problematic policy
DROP POLICY IF EXISTS "profiles_select_nearby" ON public.profiles;

-- Function to get current user's geog (bypasses RLS, no recursion)
CREATE OR REPLACE FUNCTION public.current_user_geog()
RETURNS geography
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT geog FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Recreate policy using the function (no subquery on profiles)
CREATE POLICY "profiles_select_nearby"
  ON public.profiles FOR SELECT
  USING (
    id != auth.uid()
    AND public.current_user_geog() IS NOT NULL
    AND ST_DWithin(profiles.geog, public.current_user_geog(), 1000)
  );
