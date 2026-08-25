import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type Profile = {
  id: string;
  username: string;
  balance: number;
  level: number;
  verified: boolean;
  username_chosen: boolean;
  is_admin: boolean;
  avatar_url: string | null;
};

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function avatarFor(id: string) {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(id.replace(/-/g, ""))}`;
}

async function ensureProfile(user: User): Promise<Profile> {
  if (!supabase) throw new Error("Supabase environment variables are missing.");

  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,balance,level,verified,username_chosen,is_admin,avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (data) {
    if (!data.avatar_url) {
      const avatar_url = avatarFor(user.id);
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url })
        .eq("id", user.id)
        .select("id,username,balance,level,verified,username_chosen,is_admin,avatar_url")
        .single();
      if (!updateError && updated) return updated as Profile;
    }
    return data as Profile;
  }

  const base = String(user.user_metadata?.username || user.email?.split("@")[0] || "user")
    .replace(/\s+/g, "_").slice(0, 20) || "user";

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      username: `${base}_${user.id.replace(/-/g, "").slice(0, 5)}`.slice(0, 20),
      balance: 0,
      level: 1,
      verified: false,
      username_chosen: false,
      is_admin: false,
      avatar_url: avatarFor(user.id),
    })
    .select("id,username,balance,level,verified,username_chosen,is_admin,avatar_url")
    .single();

  if (insertError) throw insertError;
  return created as Profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = async () => {
    if (!session?.user) return null;
    setError(null);
    try {
      const p = await ensureProfile(session.user);
      setProfile(p);
      return p;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unable to load profile";
      setError(message);
      return null;
    }
  };

  useEffect(() => {
    if (!supabase) {
      setError("Supabase environment variables are missing.");
      setLoading(false);
      return;
    }

    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      if (data.session?.user) {
        try { setProfile(await ensureProfile(data.session.user)); }
        catch (e) { setError(e instanceof Error ? e.message : "Unable to load profile"); }
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next?.user) {
        try { setProfile(await ensureProfile(next.user)); }
        catch (e) { setError(e instanceof Error ? e.message : "Unable to load profile"); }
      } else {
        setProfile(null);
      }
    });

    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  const value = useMemo<AuthState>(() => ({
    session, user: session?.user ?? null, profile, loading, error,
    refreshProfile,
    signOut: async () => { if (supabase) await supabase.auth.signOut(); }
  }), [session, profile, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
