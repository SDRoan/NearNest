-- NearNest schema: location-based public chat with PostGIS + RLS
-- Run in Supabase SQL Editor after enabling extensions

-- Extensions (enable in Supabase Dashboard: Database > Extensions)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles: one per auth.users; stores handle and coarse location
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT NOT NULL UNIQUE,
  lat_rounded NUMERIC(9,3) NOT NULL,
  lon_rounded NUMERIC(9,3) NOT NULL,
  geog GEOGRAPHY(POINT, 4326) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages: public nearby chat
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT NOT NULL,
  body TEXT NOT NULL,
  lat_rounded NUMERIC(9,3) NOT NULL,
  lon_rounded NUMERIC(9,3) NOT NULL,
  geog GEOGRAPHY(POINT, 4326) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT body_not_empty CHECK (length(trim(body)) > 0),
  CONSTRAINT body_max_length CHECK (length(body) <= 500)
);

-- Reports: for moderation (admins can query later)
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, reporter_id)
);

-- Indexes for performance
CREATE INDEX idx_profiles_geog ON public.profiles USING GIST(geog);
CREATE INDEX idx_messages_geog ON public.messages USING GIST(geog);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_reports_message_id ON public.reports(message_id);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/write only their own
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Messages: INSERT only as self and handle must match profile
CREATE POLICY "messages_insert_own"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND handle = (SELECT handle FROM public.profiles WHERE id = auth.uid())
  );

-- Messages: SELECT only if within 1km of viewer's profile location
CREATE POLICY "messages_select_nearby"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND ST_DWithin(messages.geog, p.geog, 1000)
    )
  );

-- Reports: authenticated users can insert
CREATE POLICY "reports_insert"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Reports: no public read (MVP); admins can query via service role if needed
CREATE POLICY "reports_no_select"
  ON public.reports FOR SELECT
  USING (false);

-- Function to ensure geog is derived from lat_rounded, lon_rounded for profiles
CREATE OR REPLACE FUNCTION public.profiles_geog_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geog := ST_SetSRID(ST_MakePoint(NEW.lon_rounded::float8, NEW.lat_rounded::float8), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_geog_before_insert_update
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_geog_trigger();

-- Same for messages
CREATE OR REPLACE FUNCTION public.messages_geog_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geog := ST_SetSRID(ST_MakePoint(NEW.lon_rounded::float8, NEW.lat_rounded::float8), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_geog_before_insert_update
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.messages_geog_trigger();
