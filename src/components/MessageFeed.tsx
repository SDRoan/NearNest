import type { Message } from "../types";
import { MessageItem } from "./MessageItem";

interface MessageFeedProps {
  messages: Message[];
  loading: boolean;
  currentHandle: string;
  onReport: (messageId: string, reason?: string | null) => void;
  onBlock: (handle: string) => void;
}

export function MessageFeed({
  messages,
  loading,
  currentHandle,
  onReport,
  onBlock,
}: MessageFeedProps) {
  if (loading) {
    return (
      <main className="feed">
        <div className="feed-loading" aria-label="Loading messages">
          <span className="loader" />
        </div>
      </main>
    );
  }

  if (messages.length === 0) {
    return (
      <main className="feed">
        <div className="feed-empty">
          <p>No nearby messages yet.</p>
          <p className="text-muted">Be the first to say something!</p>
        </div>
      </main>
    );
  }

  return (
    <main className="feed">
      <ul className="message-list" role="list">
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            isOwn={msg.handle === currentHandle}
            onReport={onReport}
            onBlock={onBlock}
          />
        ))}
      </ul>
    </main>
  );
}
