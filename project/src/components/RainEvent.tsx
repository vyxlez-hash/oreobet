import { Check, CloudRain } from "lucide-react";
import { useState } from "react";

export function RainEvent() {
  const [joined,setJoined] = useState(false);
  return <div className="rain-card">
    <div className="rain-icon"><CloudRain size={21}/></div>
    <div className="rain-copy"><strong>Rain Event</strong><span>Prize shared between verified joiners</span></div>
    <div className="rain-count">00:42</div>
    <button className="primary-btn" disabled={joined} onClick={()=>setJoined(true)}>{joined?<><Check size={15}/> Joined</>:"Join"}</button>
  </div>
}
