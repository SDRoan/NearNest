import { useState } from "react";
import { supabase } from "../supabaseClient";
import type { Profile } from "../types";

const HANDLE_MIN = 3;
const HANDLE_MAX = 20;
const HANDLE_REGEX = /^[a-zA-Z0-9_]+$/;

interface ProfileSetupProps {
  userId: string;
  onComplete: (profile: Profile) => void;
}

export function ProfileSetup({ userId, onComplete }: ProfileSetupProps) {
  const [handle, setHandle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const valid =
    handle.length >= HANDLE_MIN &&
    handle.length <= HANDLE_MAX &&
    HANDLE_REGEX.test(handle);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;

    setLoading(true);
    setError("");

    const { data, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        handle: handle.trim(),
        lat_rounded: 0,
        lon_rounded: 0,
      })
      .select("id, handle, lat_rounded, lon_rounded")
      .single();

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "That handle is already taken"
          : insertError.message
      );
      setLoading(false);
      return;
    }

    onComplete(data as Profile);
    setLoading(false);
  };

  return (
    <div className="screen">
      <div className="card">
        <h1 className="logo">Set your display name</h1>
        <p className="text-muted">
          Choose a handle others will see. {HANDLE_MIN}–{HANDLE_MAX} characters,
          letters, numbers, and underscores only.
        </p>

        <form onSubmit={handleSubmit} className="form">
          <input
            type="text"
            placeholder="handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase())}
            className="input"
            minLength={HANDLE_MIN}
            maxLength={HANDLE_MAX}
            pattern={HANDLE_REGEX.source}
            autoComplete="username"
            disabled={loading}
          />
          {error && <p className="error-msg">{error}</p>}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!valid || loading}
          >
            {loading ? "Creating…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
