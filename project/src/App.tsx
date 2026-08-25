import { useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Activity, ArrowDownToLine, Bell, CircleDollarSign, Coins, Gamepad2, Gauge, LogOut, Menu, MessageCircle, Shield, Spade, Trophy, UserRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HomePage } from "./pages/Home";
import { GamesPage } from "./pages/Games";
import { WalletPage } from "./pages/Wallet";
import { ChatPage } from "./pages/Chat";
import { ProfilePage } from "./pages/Profile";
import { AdminPage } from "./pages/Admin";
import { LoginPage } from "./pages/Login";
import { SignupPage } from "./pages/Signup";
import { GamePage } from "./pages/Game";
import { useDemoStore } from "./store/demo";
import "./recode.css";
import { useAuth } from "./store/auth";

const nav: Array<{to:string; label:string; Icon:LucideIcon}> = [
  {to:"/",label:"Home",Icon:Gauge}, {to:"/games",label:"Casino",Icon:Gamepad2},
  {to:"/games/crash",label:"Crash",Icon:Activity}, {to:"/games/blackjack",label:"Blackjack",Icon:Spade},
  {to:"/games/mines",label:"Mines",Icon:Coins}, {to:"/games/roulette",label:"Roulette",Icon:CircleDollarSign},
  {to:"/chat",label:"Chat",Icon:MessageCircle}, {to:"/wallet",label:"Wallet",Icon:ArrowDownToLine},
  {to:"/leaderboard",label:"Leaderboard",Icon:Trophy},
];

function AuthGate(){
  const {session,loading}=useAuth(); const location=useLocation();
  if(loading) return <div className="auth-loading"><div className="loading-orb"/><span>Loading OREOBET…</span></div>;
  const authPage=location.pathname==="/login" || location.pathname==="/signup";
  if(authPage && session) return <Navigate to="/" replace/>;
  if(authPage) return null;
  if(!session) return <Navigate to="/login" replace state={{from:location.pathname}}/>;
  return null;
}

function Layout(){
 const [open,setOpen]=useState(false); const {balance}=useDemoStore(); const {profile,signOut}=useAuth(); const navg=useNavigate();
 const logout=async()=>{await signOut(); setOpen(false); navg('/login',{replace:true});};
 return <div className="app-shell">
  <aside className={open?"sidebar mobile-open":"sidebar"}>
   <div className="brand"><img src="/logo.png" alt="OREOBET" onError={e=>e.currentTarget.style.display="none"}/><span>OREOBET</span></div>
   <nav>{nav.map(({to,label,Icon})=><NavLink key={to} to={to} end={to==="/"} onClick={()=>setOpen(false)}><Icon size={17}/><span>{label}</span></NavLink>)}
    {profile?.is_admin && <><div className="nav-separator"/><NavLink to="/admin" onClick={()=>setOpen(false)}><Shield size={17}/><span>Admin</span></NavLink></>}
   </nav>
   <div className="sidebar-bottom"><div className="mini-balance"><span>Balance</span><strong>${balance.toFixed(2)}</strong></div><button className="ghost-btn" onClick={logout}><LogOut size={16}/> Log out</button></div>
  </aside>
  <main className="main"><header className="topbar">
   <button className="icon-btn mobile-menu" onClick={()=>setOpen(!open)}>{open?<X size={19}/>:<Menu size={19}/>}</button><div className="topbar-spacer"/>
   <button className="balance-pill" onClick={()=>navg('/wallet')}><CircleDollarSign size={16}/>${balance.toFixed(2)}</button>
   <button className="icon-btn" aria-label="Notifications"><Bell size={18}/></button>
   <button className="avatar-button" onClick={()=>navg('/profile')} aria-label="Profile">
    {profile?.avatar_url ? <img className="avatar avatar-img" src={profile.avatar_url} alt=""/> : <span className="avatar-skeleton"/>}
   </button>
  </header><div className="content"><Routes>
   <Route path="/" element={<HomePage/>}/><Route path="/games" element={<GamesPage/>}/><Route path="/games/:game" element={<GamePage/>}/>
   <Route path="/wallet" element={<WalletPage/>}/><Route path="/chat" element={<ChatPage/>}/><Route path="/profile" element={<ProfilePage/>}/>
   <Route path="/admin" element={profile?.is_admin?<AdminPage/>:<Navigate to="/" replace/>}/><Route path="/leaderboard" element={<Leaderboard/>}/>
  </Routes></div></main>
 </div>;
}
function Leaderboard(){const rows=["Nova","Kairo","Mira","Onyx","Zen"];return <section><PageTitle eyebrow="COMPETITIVE" title="Leaderboard" sub="Top players across the platform."/><div className="panel table">{rows.map((name,i)=><div className="table-row" key={name}><b>#{i+1}</b><span className="avatar small generated-avatar" data-seed={name}/><strong>{name}</strong><span className="muted">Weekly</span><strong>${(4200-i*617).toLocaleString()}</strong></div>)}</div></section>}
export function PageTitle({eyebrow,title,sub}:{eyebrow:string,title:string,sub:string}){return <div className="page-title"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{sub}</p></div>}
export default function App(){return <><AuthGate/><Routes><Route path="/login" element={<LoginPage/>}/><Route path="/signup" element={<SignupPage/>}/></Routes><ProtectedLayout/></>}
function ProtectedLayout(){const {session,loading}=useAuth(); if(loading||!session)return null; return <Layout/>}
