import { useState } from "react";
import type { Message } from "../types";

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  onReport: (messageId: string, reason?: string | null) => void;
  onBlock: (handle: string) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageItem({
  message,
  isOwn,
  onReport,
  onBlock,
}: MessageItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleReport = () => {
    onReport(message.id);
    setMenuOpen(false);
  };

  const handleBlock = () => {
    onBlock(message.handle);
    setMenuOpen(false);
  };

  return (
    <li className={`message-item ${isOwn ? "message-own" : ""}`}>
      <div className="message-content">
        <div className="message-meta">
          <span className="message-handle">{message.handle}</span>
          <span className="message-time">{formatTime(message.created_at)}</span>
        </div>
        <p className="message-body">{message.body}</p>
      </div>
      {!isOwn && (
        <div className="message-actions">
          <button
            type="button"
            className="btn btn-icon btn-ghost"
            onClick={() => setMenuOpen(!menuOpen)}
            title="More"
            aria-label="More options"
            aria-expanded={menuOpen}
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="message-menu">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleReport}
              >
                Report
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleBlock}
              >
                Block user
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
