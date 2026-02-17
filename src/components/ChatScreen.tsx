import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import type { Profile } from "../types";
import type { Message } from "../types";
import { MessageFeed } from "./MessageFeed";
import { MessageComposer } from "./MessageComposer";
import { useBlockList } from "../hooks/useBlockList";

const THROTTLE_MS = 1500;

interface ChatScreenProps {
  profile: Profile;
}

export function ChatScreen({ profile }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);
  const { blockUser, isBlocked } = useBlockList();

  const fetchMessages = useCallback(async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("messages")
      .select("id, handle, body, created_at")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("fetch messages:", error);
      setMessages([]);
    } else {
      setMessages((data ?? []) as Message[]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const handleSend = async (body: string): Promise<boolean> => {
    const now = Date.now();
    if (now - lastSentAt < THROTTLE_MS) return false;

    const lat = profile.lat_rounded;
    const lon = profile.lon_rounded;

    const { error } = await supabase.from("messages").insert({
      handle: profile.handle,
      body: body.trim(),
      lat_rounded: lat,
      lon_rounded: lon,
    });

    if (error) {
      console.error("send message:", error);
      return false;
    }

    setLastSentAt(now);
    return true;
  };

  const handleReport = async (
    messageId: string,
    reason?: string | null
  ): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("reports").insert({
      message_id: messageId,
      reporter_id: user.id,
      reason: reason ?? null,
    });
  };

  const visibleMessages = messages.filter((m) => !isBlocked(m.handle));

  return (
    <div className="chat-screen">
      <header className="chat-header">
        <h1 className="logo-small">NearNest</h1>
        <span className="header-badge">Nearby</span>
        <div className="chat-header-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => supabase.auth.signOut()}
            title="Sign out"
          >
            Sign out
          </button>
          <button
          className="btn btn-icon"
          onClick={handleRefresh}
          disabled={refreshing || loading}
            title="Refresh"
            aria-label="Refresh"
          >
            {refreshing || loading ? "⋯" : "↻"}
          </button>
        </div>
      </header>

      <MessageFeed
        messages={visibleMessages}
        loading={loading}
        currentHandle={profile.handle}
        onReport={handleReport}
        onBlock={blockUser}
      />

      <MessageComposer onSend={handleSend} throttleMs={THROTTLE_MS} />
    </div>
  );
}
