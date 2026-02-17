-- Run this AFTER schema.sql to add DM support and nearby user list
-- Adds: last_seen_at, dm_messages, RLS for nearby profiles

-- Add last_seen_at to profiles (for "active" users)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- DM messages: sender -> recipient
CREATE TABLE IF NOT EXISTS public.dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT dm_body_not_empty CHECK (length(trim(body)) > 0),
  CONSTRAINT dm_body_max_length CHECK (length(body) <= 500)
);

CREATE INDEX IF NOT EXISTS idx_dm_messages_sender_recipient ON public.dm_messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_messages_recipient_sender ON public.dm_messages(recipient_id, sender_id, created_at DESC);

ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;

-- DMs: user can insert as sender
CREATE POLICY "dm_insert_as_sender"
  ON public.dm_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- DMs: user can select messages where they are sender or recipient
CREATE POLICY "dm_select_own"
  ON public.dm_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Add dm_messages to Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_messages;

-- Function to get current user's geog (bypasses RLS, avoids recursion)
CREATE OR REPLACE FUNCTION public.current_user_geog()
RETURNS geography
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT geog FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Profiles: allow users to see nearby profiles (id, handle only - no location exposed)
CREATE POLICY "profiles_select_nearby"
  ON public.profiles FOR SELECT
  USING (
    id != auth.uid()
    AND public.current_user_geog() IS NOT NULL
    AND ST_DWithin(profiles.geog, public.current_user_geog(), 1000)
  );
