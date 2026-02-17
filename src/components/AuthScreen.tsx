import { useState } from "react";
import { supabase } from "../supabaseClient";
import { isConfigValid } from "../config";

export function AuthScreen() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("sending");
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setStatus("sent");
  };

  return (
    <div className="screen auth-screen">
      <div className="card auth-card">
        <h1 className="logo">NearNest</h1>
        <p className="tagline">Nearby Chat — connect with people around you</p>

        {status === "sent" ? (
          <div className="auth-success">
            <p>Check your email for a magic link to sign in.</p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setStatus("idle");
                setEmail("");
              }}
            >
              Use a different email
            </button>
          </div>
        ) : !isConfigValid ? (
          <div className="auth-config-prompt">
            <p className="error-msg">
              Supabase is not configured. Open <code>src/config.ts</code> and
              replace the placeholders with your Supabase URL and anon key from
              the <a
                href="https://supabase.com/dashboard/project/_/settings/api"
                target="_blank"
                rel="noopener noreferrer"
              >
                Supabase Dashboard
              </a>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
              autoComplete="email"
              disabled={status === "sending"}
            />
            {errorMsg && <p className="error-msg">{errorMsg}</p>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
