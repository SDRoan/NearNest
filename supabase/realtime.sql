-- Add messages table to Supabase Realtime publication
-- Run this in Supabase SQL Editor after schema.sql

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
