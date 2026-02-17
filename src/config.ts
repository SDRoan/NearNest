/**
 * NearNest configuration.
 *
 * Uses env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) when set (e.g. on Vercel).
 * Otherwise, copy config.example.ts to config.ts and add your keys for local dev.
 */

const fromEnv = (key: string): string =>
  (import.meta.env[key] as string | undefined) ?? "";

export const SUPABASE_URL =
  fromEnv("VITE_SUPABASE_URL") || "https://your-project-id.supabase.co";
export const SUPABASE_ANON_KEY =
  fromEnv("VITE_SUPABASE_ANON_KEY") || "your-anon-key-here";

export const isConfigValid =
  SUPABASE_URL !== "https://your-project-id.supabase.co" &&
  SUPABASE_ANON_KEY !== "your-anon-key-here";
