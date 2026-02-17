import { useState } from "react";
import { supabase } from "../supabaseClient";
import type { Profile } from "../types";
import { roundTo3Decimals } from "../utils/geo";

interface LocationSetupProps {
  profile: Profile;
  onComplete: () => void;
}

export function LocationSetup({ profile, onComplete }: LocationSetupProps) {
  const [status, setStatus] = useState<
    "idle" | "requesting" | "denied" | "updating" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const requestLocation = () => {
    setStatus("requesting");
    setErrorMsg("");

    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = roundTo3Decimals(position.coords.latitude);
        const lon = roundTo3Decimals(position.coords.longitude);

        setStatus("updating");

        const { error } = await supabase
          .from("profiles")
          .update({ lat_rounded: lat, lon_rounded: lon })
          .eq("id", profile.id);

        if (error) {
          setStatus("error");
          setErrorMsg(error.message);
          return;
        }

        onComplete();
      },
      (err) => {
        setStatus(err.code === 1 ? "denied" : "error");
        setErrorMsg(
          err.code === 1
            ? "Location access was denied. NearNest needs your location to show nearby messages."
            : err.message || "Failed to get location."
        );
      },
      { enableHighAccuracy: false }
    );
  };

  return (
    <div className="screen">
      <div className="card">
        <h1 className="logo">Enable location</h1>
        <p className="text-muted">
          NearNest shows messages from people within ~1km of you. Your exact
          location is never displayed. Coordinates are rounded for privacy.
        </p>

        {status === "denied" || status === "error" ? (
          <div className="location-error">
            <p className="error-msg">{errorMsg}</p>
            <p className="text-muted">
              If you denied by mistake, refresh the page and try again.
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setStatus("idle");
                setErrorMsg("");
              }}
            >
              Try again
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-large"
            onClick={requestLocation}
            disabled={status === "requesting" || status === "updating"}
          >
            {status === "requesting" || status === "updating"
              ? "Getting location…"
              : "Enable location"}
          </button>
        )}
      </div>
    </div>
  );
}
