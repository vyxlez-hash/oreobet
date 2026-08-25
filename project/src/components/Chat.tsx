import { useMemo, useState } from "react";
import { Send, Shield, VolumeX, X } from "lucide-react";

type Msg={id:number;user:string;text:string;role?:string};

export function Chat() {
  const [messages,setMessages]=useState<Msg[]>([
    {id:1,user:"Nova",text:"good luck everyone"},
    {id:2,user:"Kairo",text:"that crash was wild"},
    {id:3,user:"Mira",text:"joining the rain"},
  ]);
  const [input,setInput]=useState("");
  const [tipUser,setTipUser]=useState<string|null>(null);
  const [tip,setTip]=useState("");
  const [muted,setMuted]=useState<string[]>([]);

  const visible=useMemo(()=>messages.filter(m=>!muted.includes(m.user.toLowerCase())),[messages,muted]);

  function command(raw:string) {
    const p=raw.trim().split(/\s+/), c=p[0]?.toLowerCase();
    if(c==="/clear") {
      const n=p[1] ? Number(p[1]) : messages.length;
      if(Number.isInteger(n) && n>=1) setMessages(x=>x.slice(0,Math.max(0,x.length-n)));
      return true;
    }
    if(c==="/mute" && p[1]) { setMuted(x=>x.includes(p[1].toLowerCase())?x:[...x,p[1].toLowerCase()]); return true; }
    if(c==="/unmute" && p[1]) { setMuted(x=>x.filter(u=>u!==p[1].toLowerCase())); return true; }
    return c?.startsWith("/") ?? false;
  }

  return <div className="chat-panel">
    <div className="chat-head"><div><strong>Live Chat</strong><span>Realtime activity</span></div><span className="online-dot">● 128 online</span></div>
    <div className="chat-list">
      {visible.map(m=><div className="chat-row" key={m.id}>
        <button className="avatar small" onClick={()=>setTipUser(m.user)}>{m.user[0]}</button>
        <div className="chat-body"><div><button className="username" onClick={()=>setTipUser(m.user)}>{m.user}</button><span className="time">now</span></div><p>{m.text}</p></div>
      </div>)}
    </div>
    <div className="chat-compose">
      <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&input.trim()){if(!command(input))setMessages(x=>[...x,{id:Date.now(),user:"You",text:input.trim()}]);setInput("")}}} placeholder="Message or /command..." />
      <button className="icon-btn" onClick={()=>{if(input.trim()){if(!command(input))setMessages(x=>[...x,{id:Date.now(),user:"You",text:input.trim()}]);setInput("")}}}><Send size={16}/></button>
    </div>
    {tipUser && <div className="modal-backdrop" onMouseDown={e=>e.currentTarget===e.target&&setTipUser(null)}>
      <div className="modal"><button className="modal-x" onClick={()=>setTipUser(null)}><X size={18}/></button><div className="avatar big">{tipUser[0]}</div><h3>Tip {tipUser}</h3><p className="muted">Enter an amount to continue.</p><input autoFocus className="large-input" type="number" min="0" value={tip} onChange={e=>setTip(e.target.value)} placeholder="0.00"/><button className="primary-btn full" onClick={()=>setTipUser(null)}>Continue</button></div>
    </div>}
  </div>
}
