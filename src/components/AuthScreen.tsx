import { useState } from "react";
import { supabase } from "../supabaseClient";
import { isConfigValid } from "../config";

export function AuthScreen() {
  const [status, setStatus] = useState<"idle" | "joining" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleJoin = async () => {
    if (!isConfigValid) return;

    setStatus("joining");
    setErrorMsg("");

    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
  };

  return (
    <div className="screen auth-screen">
      <div className="card auth-card">
        <h1 className="logo">NearNest</h1>
        <p className="tagline">
          Nearby Chat — connect with people around you. No account needed.
        </p>

        {!isConfigValid ? (
          <div className="auth-config-prompt">
            <p className="error-msg">
              Supabase is not configured. Add VITE_SUPABASE_URL and
              VITE_SUPABASE_ANON_KEY to your environment (or .env.local for
              local dev) — see the{" "}
              <a
                href="https://supabase.com/dashboard/project/_/settings/api"
                target="_blank"
                rel="noopener noreferrer"
              >
                Supabase Dashboard
              </a>
              .
            </p>
          </div>
        ) : (
          <>
            {errorMsg && <p className="error-msg">{errorMsg}</p>}
            <button
              type="button"
              className="btn btn-primary btn-large"
              onClick={handleJoin}
              disabled={status === "joining"}
            >
              {status === "joining" ? "Joining…" : "Join"}
            </button>
            <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
              You’ll get a random name. No email required.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
