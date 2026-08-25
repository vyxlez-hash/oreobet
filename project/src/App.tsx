import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import {
  Activity, ArrowDownToLine, Bell, CircleDollarSign, Coins, Gamepad2,
  Gauge, LogOut, Menu, MessageCircle, Shield, Spade,
  Trophy, UserRound, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HomePage } from "./pages/Home";
import { GamesPage } from "./pages/Games";
import { WalletPage } from "./pages/Wallet";
import { ChatPage } from "./pages/Chat";
import { ProfilePage } from "./pages/Profile";
import { AdminPage } from "./pages/Admin";
import { LoginPage } from "./pages/Login";
import { GamePage } from "./pages/Game";
import { useDemoStore } from "./store/demo";
import { useAuth } from "./store/auth";

const nav: Array<[string, string, LucideIcon]> = [
  ["/", "Home", Gauge],
  ["/games", "Casino", Gamepad2],
  ["/games/crash", "Crash", Activity],
  ["/games/blackjack", "Blackjack", Spade],
  ["/games/mines", "Mines", Coins],
  ["/games/roulette", "Roulette", CircleDollarSign],
  ["/chat", "Chat", MessageCircle],
  ["/wallet", "Wallet", ArrowDownToLine],
  ["/leaderboard", "Leaderboard", Trophy],
];

function Layout() {
  const [open, setOpen] = useState(false);
  const { balance } = useDemoStore();
  const { profile, signOut } = useAuth();

  return (
    <div className="app-shell">
      <aside className={open ? "sidebar mobile-open" : "sidebar"}>
        <div className="brand">
          <img src="/logo.png" onError={(e) => (e.currentTarget.style.display = "none")} />
          <span>OREOBET</span>
        </div>
        <nav>
          {nav.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === "/"} onClick={() => setOpen(false)}>
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="nav-separator" />
          <NavLink to="/profile"><UserRound size={17}/><span>Profile</span></NavLink>
          <NavLink to="/admin"><Shield size={17}/><span>Admin</span></NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-balance">
            <span>Balance</span>
            <strong>${balance.toFixed(2)}</strong>
          </div>
          <button className="ghost-btn" onClick={signOut}><LogOut size={16}/> Log out</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={() => setOpen(!open)}>
            {open ? <X size={19}/> : <Menu size={19}/>} 
          </button>
          <div className="topbar-spacer" />
          <button className="balance-pill" onClick={() => location.href="/wallet"}>
            <CircleDollarSign size={16}/>
            ${balance.toFixed(2)}
          </button>
          <button className="icon-btn"><Bell size={18}/></button>
          {profile?.avatar_url ? <img className="avatar avatar-img" src={profile.avatar_url} alt="" /> : <div className="avatar">{profile?.username?.[0]?.toUpperCase() || "O"}</div>}
        </header>
        <div className="content">
          <Routes>
            <Route path="/" element={<HomePage/>}/>
            <Route path="/games" element={<GamesPage/>}/>
            <Route path="/games/:game" element={<GamePage/>}/>
            <Route path="/wallet" element={<WalletPage/>}/>
            <Route path="/chat" element={<ChatPage/>}/>
            <Route path="/profile" element={<ProfilePage/>}/>
            <Route path="/admin" element={<AdminPage/>}/>
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/leaderboard" element={<Leaderboard/>}/>
          </Routes>
        </div>
      </main>
    </div>
  );
}

function Leaderboard() {
  const rows = ["Nova", "Kairo", "Mira", "Onyx", "Zen"];
  return <section>
    <PageTitle eyebrow="COMPETITIVE" title="Leaderboard" sub="Top players across the platform." />
    <div className="panel table">
      {rows.map((name, i) => <div className="table-row" key={name}><b>#{i+1}</b><span className="avatar small">{name[0]}</span><strong>{name}</strong><span className="muted">Weekly</span><strong>${(4200-i*617).toLocaleString()}</strong></div>)}
    </div>
  </section>
}

export function PageTitle({eyebrow,title,sub}:{eyebrow:string,title:string,sub:string}) {
  return <div className="page-title"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{sub}</p></div>
}

export default function App() {
  return <Layout/>;
}
