import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function LoginPage(){
  const nav = useNavigate();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  const submit=async(e:FormEvent)=>{
    e.preventDefault(); setBusy(true); setError("");
    if(!supabase){setError("Supabase is not configured.");setBusy(false);return;}
    const {error:authError}=await supabase.auth.signInWithPassword({email,password});
    if(authError){setError(authError.message);setBusy(false);return;}
    nav("/");
  };

  return <div className="auth-page"><form className="auth-card" onSubmit={submit}>
    <div className="brand centered"><img src="/logo.png" onError={(e)=>e.currentTarget.style.display="none"}/><span>OREOBET</span></div>
    <h1>Welcome back</h1><p className="muted">Sign in to continue.</p>
    {error && <div className="error-box">{error}</div>}
    <input className="large-input" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
    <input className="large-input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
    <button className="primary-btn full" disabled={busy}>{busy?"Signing in…":"Sign in"}</button>
    <Link to="/" className="muted centered-link">Back home</Link>
  </form></div>
}
