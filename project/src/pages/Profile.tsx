import { Shield, UserRound } from "lucide-react";
import { PageTitle } from "../App";
import { useAuth } from "../store/auth";

export function ProfilePage(){
  const { profile, loading, error } = useAuth();
  if (loading) return <section><PageTitle eyebrow="ACCOUNT" title="Profile" sub="Loading your profile…"/></section>;
  if (error) return <section><PageTitle eyebrow="ACCOUNT" title="Profile" sub="Your account is signed in, but the profile could not be loaded."/><div className="panel error-box"><strong>Profile error</strong><p>{error}</p><p className="muted">Run the supplied Supabase migration, then refresh.</p></div></section>;
  return <section><PageTitle eyebrow="ACCOUNT" title="Profile" sub="Manage your account and security."/>
    <div className="profile-grid"><div className="panel profile-card">
      {profile?.avatar_url ? <img className="avatar giant avatar-img" src={profile.avatar_url} alt="" /> : <div className="avatar giant">{profile?.username?.[0]?.toUpperCase() || "O"}</div>}
      <h2>{profile?.username || "Player"}</h2>
      <span className="badge"><Shield size={13}/> {profile?.verified ? "Verified" : "Player"}</span>
      {profile?.is_admin && <span className="badge"><UserRound size={13}/> Admin</span>}
    </div><div className="panel settings"><div><strong>Account security</strong><p className="muted">2FA and active sessions</p></div><button className="secondary-btn">Manage</button><div><strong>Notifications</strong><p className="muted">Game and transaction updates</p></div><button className="secondary-btn">Configure</button></div></div>
  </section>
}
