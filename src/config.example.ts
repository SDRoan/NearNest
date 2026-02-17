/**
 * NearNest configuration.
 *
 * Copy this file to config.ts and add your Supabase credentials:
 *   cp src/config.example.ts src/config.ts
 *
 * Get your Supabase URL and anon key from:
 * Supabase Dashboard → Project Settings → API
 *
 * Paste them in config.ts (replace the placeholder strings).
 * Do NOT commit config.ts to version control.
 */

export const SUPABASE_URL = "https://your-project-id.supabase.co";
export const SUPABASE_ANON_KEY = "your-anon-key-or-sb_publishable-key-here";

export const isConfigValid =
  SUPABASE_URL !== "https://your-project-id.supabase.co" &&
  SUPABASE_ANON_KEY !== "your-anon-key-or-sb_publishable-key-here";
