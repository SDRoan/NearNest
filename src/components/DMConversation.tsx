import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import type { Profile } from "../types";

interface DMMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
}

interface DMConversationProps {
  currentProfile: Profile;
  otherUser: { id: string; handle: string };
  onBack: () => void;
}

const THROTTLE_MS = 1500;

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function DMConversation({
  currentProfile,
  otherUser,
  onBack,
}: DMConversationProps) {
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSentAt, setLastSentAt] = useState(0);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("dm_messages")
      .select("id, sender_id, recipient_id, body, created_at")
      .or(
        `and(sender_id.eq.${currentProfile.id},recipient_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},recipient_id.eq.${currentProfile.id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("fetch dm messages:", error);
      setMessages([]);
    } else {
      setMessages((data ?? []) as DMMessage[]);
    }
    setLoading(false);
  }, [currentProfile.id, otherUser.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`dm-${currentProfile.id}-${otherUser.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dm_messages" },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, currentProfile.id, otherUser.id]);

  const handleSend = async (body: string): Promise<boolean> => {
    const now = Date.now();
    if (now - lastSentAt < THROTTLE_MS) return false;

    const { error } = await supabase.from("dm_messages").insert({
      sender_id: currentProfile.id,
      recipient_id: otherUser.id,
      body: body.trim(),
    });

    if (error) {
      console.error("send dm:", error);
      return false;
    }
    setLastSentAt(now);
    return true;
  };

  return (
    <div className="dm-conversation">
      <header className="dm-header">
        <button
          type="button"
          className="btn btn-ghost btn-back"
          onClick={onBack}
          aria-label="Back"
        >
          ← Back
        </button>
        <span className="dm-header-handle">{otherUser.handle}</span>
      </header>
      {loading ? (
        <div className="feed-loading">
          <span className="loader" aria-label="Loading" />
        </div>
      ) : (
        <ul className="dm-message-list" role="list">
          {messages.map((m) => {
            const isOwn = m.sender_id === currentProfile.id;
            return (
              <li
                key={m.id}
                className={`dm-message ${isOwn ? "dm-message-own" : ""}`}
              >
                <p className="dm-message-body">{m.body}</p>
                <span className="dm-message-time">{formatTime(m.created_at)}</span>
              </li>
            );
          })}
        </ul>
      )}
      <footer className="composer">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const input = form.querySelector("textarea") as HTMLTextAreaElement;
            if (!input?.value.trim()) return;
            const ok = await handleSend(input.value);
            if (ok) input.value = "";
          }}
          className="composer-form"
        >
          <textarea
            placeholder={`Message ${otherUser.handle}…`}
            className="composer-input"
            rows={1}
            maxLength={500}
          />
          <button type="submit" className="btn btn-primary btn-send">
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}
