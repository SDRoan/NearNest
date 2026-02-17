import { useState } from "react";
import type { Profile } from "../types";
import { NearbyUserList } from "./NearbyUserList";
import { DMConversation } from "./DMConversation";

interface InboxScreenProps {
  profile: Profile;
  onSignOut: () => void;
}

interface NearbyUser {
  id: string;
  handle: string;
}

export function InboxScreen({ profile, onSignOut }: InboxScreenProps) {
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);

  return (
    <div className="chat-screen">
      <header className="chat-header">
        <h1 className="logo-small">NearNest</h1>
        <span className="header-badge">Nearby</span>
        <div className="chat-header-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onSignOut}
            title="Sign out"
          >
            Sign out
          </button>
        </div>
      </header>

      {selectedUser ? (
        <DMConversation
          currentProfile={profile}
          otherUser={selectedUser}
          onBack={() => setSelectedUser(null)}
        />
      ) : (
        <NearbyUserList
          currentProfile={profile}
          onSelectUser={setSelectedUser}
        />
      )}
    </div>
  );
}
