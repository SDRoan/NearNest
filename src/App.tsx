import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "./types";
import { AuthScreen } from "./components/AuthScreen";
import { ProfileSetup } from "./components/ProfileSetup";
import { LocationSetup } from "./components/LocationSetup";
import { ChatScreen } from "./components/ChatScreen";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, handle, lat_rounded, lon_rounded")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as Profile;
  };

  const onProfileCreated = (p: Profile) => setProfile(p);
  const onLocationSet = () => {
    if (user) fetchProfile(user.id).then(setProfile);
  };

  if (loading) {
    return (
      <div className="screen">
        <div className="loader" aria-label="Loading" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!profile) {
    return <ProfileSetup userId={user.id} onComplete={onProfileCreated} />;
  }

  const hasLocation =
    profile.lat_rounded !== 0 || profile.lon_rounded !== 0;
  if (!hasLocation) {
    return <LocationSetup profile={profile} onComplete={onLocationSet} />;
  }

  return <ChatScreen profile={profile} />;
}
