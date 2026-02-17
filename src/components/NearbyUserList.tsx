import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import type { Profile } from "../types";

interface NearbyUser {
  id: string;
  handle: string;
}

interface NearbyUserListProps {
  currentProfile: Profile;
  onSelectUser: (user: NearbyUser) => void;
}

export function NearbyUserList({
  currentProfile,
  onSelectUser,
}: NearbyUserListProps) {
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);

  const updateLastSeen = useCallback(async () => {
    await supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", currentProfile.id);
  }, [currentProfile.id]);

  const fetchNearbyUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, handle")
      .neq("id", currentProfile.id)
      .order("last_seen_at", { ascending: false });

    if (error) {
      console.error("fetch nearby users:", error);
      setUsers([]);
    } else {
      setUsers((data ?? []) as NearbyUser[]);
    }
    setLoading(false);
  }, [currentProfile.id]);

  useEffect(() => {
    fetchNearbyUsers();
    updateLastSeen();
  }, [fetchNearbyUsers, updateLastSeen]);

  const handleRefresh = () => {
    setLoading(true);
    fetchNearbyUsers();
    updateLastSeen();
  };

  return (
    <main className="feed">
      <div className="user-list-header">
        <h2>Nearby users</h2>
        <button
          type="button"
          className="btn btn-icon btn-ghost"
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh"
          aria-label="Refresh"
        >
          {loading ? "⋯" : "↻"}
        </button>
      </div>
      {loading ? (
        <div className="feed-loading" aria-label="Loading">
          <span className="loader" />
        </div>
      ) : users.length === 0 ? (
        <div className="feed-empty">
          <p>No other users nearby.</p>
          <p className="text-muted">
            Be the first in your area—or ask a friend to join!
          </p>
        </div>
      ) : (
        <ul className="user-list" role="list">
          {users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className="user-list-item"
                onClick={() => onSelectUser(u)}
              >
                <span className="user-handle">{u.handle}</span>
                <span className="user-arrow">→</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
