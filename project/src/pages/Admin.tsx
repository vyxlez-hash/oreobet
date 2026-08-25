import { useState } from "react";
import { PageTitle } from "../App";
import { demoStore, useDemoStore } from "../store/demo";
import { Save, Ban, Plus, Minus, Trash2 } from "lucide-react";

export function AdminPage(){
 const {balance}=useDemoStore(); const [coin,setCoin]=useState("LTC"); const [address,setAddress]=useState("LTC_DEPOSIT_ADDRESS_HERE"); const [saved,setSaved]=useState(false); const [amount,setAmount]=useState("50");
 const users=["Nova","Kairo","Mira","Zen","Onyx"];
 return <section><PageTitle eyebrow="ADMIN" title="Control center" sub="Manual management, requests, and audit-friendly controls."/>
 <div className="admin-grid">
  <div className="panel"><div className="panel-title">Deposit addresses</div><div className="coin-tabs">{["LTC","ETH","SOL"].map(c=><button className={coin===c?"active":""} onClick={()=>{setCoin(c);setAddress(`${c}_DEPOSIT_ADDRESS_HERE`)}} key={c}>{c}</button>)}</div><label className="field-label">Current {coin} address</label><input className="large-input" value={address} onChange={e=>setAddress(e.target.value)}/><button className="primary-btn full" onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),1500)}}><Save size={15}/> Save address</button>{saved&&<div className="inline-success">Saved for everyone.</div>}</div>
  <div className="panel"><div className="panel-title">Manual balance adjustment</div><select className="large-input"><option>Select user</option>{users.map(u=><option key={u}>{u}</option>)}</select><input className="large-input" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount"/><div className="quick-row"><button onClick={()=>demoStore.adjustBalance(Number(amount))}><Plus size={14}/> Add money</button><button onClick={()=>demoStore.adjustBalance(-Number(amount))}><Minus size={14}/> Remove money</button></div><p className="muted small-note">Demo UI: connect these controls to your authenticated admin API and immutable ledger.</p></div>
 </div>
 <div className="panel table"><div className="panel-title">Users</div>{users.map(u=><div className="table-row" key={u}><span className="avatar small">{u[0]}</span><strong>{u}</strong><span className="muted">Active</span><span>${balance.toFixed(2)}</span><button className="danger-btn"><Ban size={14}/> Ban</button></div>)}</div>
 <div className="panel table"><div className="panel-title">Deposit requests</div>{["Nova · LTC · 100","Kairo · ETH · 250","Mira · SOL · 80"].map(x=><div className="table-row" key={x}><strong>{x}</strong><span className="status">Pending</span><button className="danger-btn"><Trash2 size={14}/> Delete</button></div>)}</div>
 </section>
}
