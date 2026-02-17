import { useState, useRef } from "react";

const BODY_MAX = 500;

interface MessageComposerProps {
  onSend: (body: string) => Promise<boolean>;
  throttleMs: number;
}

export function MessageComposer({ onSend, throttleMs }: MessageComposerProps) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [throttled, setThrottled] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const valid = body.trim().length > 0 && body.trim().length <= BODY_MAX;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || sending || throttled) return;

    setSending(true);
    const text = body.trim();
    setBody("");

    const ok = await onSend(text);
    setSending(false);

    if (!ok) {
      setBody(text);
      setThrottled(true);
      setTimeout(() => setThrottled(false), throttleMs);
    }

    inputRef.current?.focus();
  };

  return (
    <footer className="composer">
      <form onSubmit={handleSubmit} className="composer-form">
        <textarea
          ref={inputRef}
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
          placeholder="Say something nearby…"
          className="composer-input"
          rows={1}
          disabled={sending}
          maxLength={BODY_MAX}
        />
        <button
          type="submit"
          className="btn btn-primary btn-send"
          disabled={!valid || sending}
          title={throttled ? "Please wait before sending again" : "Send"}
        >
          {sending ? "…" : "Send"}
        </button>
      </form>
      {throttled && (
        <p className="composer-throttle text-muted">
          Wait a moment before sending again
        </p>
      )}
    </footer>
  );
}
