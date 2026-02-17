import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import type { Profile } from "../types";

function generateHandle(): string {
  const id = crypto.randomUUID().slice(0, 8);
  return `User_${id}`;
}

interface ProfileSetupProps {
  userId: string;
  onComplete: (profile: Profile) => void;
}

export function ProfileSetup({ userId, onComplete }: ProfileSetupProps) {
  const [error, setError] = useState("");

  const createProfile = async (attempt = 0): Promise<void> => {
    const handle = generateHandle();
    setError("");

    const { data, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        handle,
        lat_rounded: 0,
        lon_rounded: 0,
      })
      .select("id, handle, lat_rounded, lon_rounded")
      .single();

    if (insertError) {
      if (insertError.code === "23505" && attempt < 3) {
        createProfile(attempt + 1);
        return;
      }
      setError(insertError.message);
      return;
    }

    onComplete(data as Profile);
  };

  useEffect(() => {
    createProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="screen">
        <div className="card">
          <h1 className="logo">Something went wrong</h1>
          <p className="error-msg">{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => createProfile(0)}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="card">
        <div className="loader" aria-label="Creating your profile" />
        <p className="text-muted" style={{ marginTop: "1rem" }}>
          Creating your profile…
        </p>
      </div>
    </div>
  );
}
