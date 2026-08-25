import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, ChevronLeft, Clock3, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { Countdown } from "../components/Countdown";

const titles:Record<string,string>={coinflip:"Coinflip",crash:"Crash",mines:"Mines",blackjack:"Blackjack",roulette:"Roulette",dice:"Dice"};

export function GamePage(){
  const {game="coinflip"}=useParams();
  const title=titles[game]||"Game";
  return <section>
    <div className="game-top"><Link to="/games" className="back"><ChevronLeft size={17}/> Games</Link><div className="round-status"><span className="live-dot"/> LIVE · ROUND #849213</div></div>
    {game==="crash"?<Crash/>:game==="roulette"?<Roulette/>:game==="mines"?<Mines/>:game==="blackjack"?<Blackjack/>:game==="dice"?<Dice/>:<Coinflip title={title}/>}
  </section>
}

function GameFrame({children,side}:{children:React.ReactNode;side:React.ReactNode}){
 return <div className="game-layout"><div className="game-stage">{children}</div><aside className="bet-panel">{side}</aside></div>
}

function BetControls({label="Bet amount"}){
 const [amount,setAmount]=useState("10");
 return <><label className="field-label">{label}</label><input className="large-input" value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal"/><div className="quick-row">{[1,2,5,10].map(x=><button key={x} onClick={()=>setAmount(String(x))}>${x}</button>)}</div><button className="primary-btn full">Place bet</button></>
}

function Coinflip({title}:{title:string}){
 const [flipping,setFlipping]=useState(false),[result,setResult]=useState<"H"|"T"|null>(null);
 const flip=()=>{if(flipping)return;setFlipping(true);setResult(null);setTimeout(()=>{setResult(Math.random()>.5?"H":"T");setFlipping(false)},3200)};
 return <GameFrame side={<><div className="panel-title">Coinflip</div><div className="choice-grid"><button>HEADS</button><button>TAILS</button></div><BetControls/></>}>
   <div className="game-center"><div className="coin-scene"><div className={`coin ${flipping?"flipping":""} ${result === "T" ? "tail-result" : ""}`}><span>H</span><span>T</span></div></div><div className="result-big">{result?result:"H / T"}</div><p className="muted">Slow throw · spin · fall · settle</p><button className="secondary-btn" onClick={flip}><RotateCcw size={15}/> Flip</button></div>
 </GameFrame>
}

function Crash(){
 const [phase,setPhase]=useState<"cooldown"|"run">("cooldown"),[sec,setSec]=useState(10),[mult,setMult]=useState(1);
 useEffect(()=>{let t=window.setInterval(()=>{setSec(s=>{if(s<=1){setPhase("run");return 10}return s-1})},1000);return()=>clearInterval(t)},[]);
 useEffect(()=>{if(phase!=="run")return;let t=window.setInterval(()=>setMult(m=>{if(m>7){setPhase("cooldown");return 1}return +(m+.07).toFixed(2)}),120);return()=>clearInterval(t)},[phase]);
 return <GameFrame side={<><div className="panel-title">Crash</div><BetControls/><div className="auto-row"><span>Auto cashout</span><span className="switch"/></div></>}>
   <div className="crash-stage"><div className="graph-grid"/><div className="crash-glow" style={{transform:`translateY(${Math.max(0,120-mult*13)}px)`}}/><div className="crash-mult">{phase==="run"?`${mult.toFixed(2)}x`:<Countdown seconds={sec}/>}</div><div className="curve" style={{"--rise":`${Math.min(82,mult*11)}%`} as React.CSSProperties}/><div className="live-players"><span><i/> Nova <b>2.41x</b></span><span><i/> Kairo <b>4.82x</b></span><span><i/> Mira <b>1.77x</b></span></div></div>
 </GameFrame>
}

function Mines(){
 const [size,setSize]=useState<4|6>(4),[bombs,setBombs]=useState(3),[opened,setOpened]=useState<number[]>([]);
 const cells=Array.from({length:size*size},(_,i)=>i);
 return <GameFrame side={<><div className="panel-title">Mines</div><label className="field-label">Board</label><div className="choice-grid"><button className={size===4?"selected":""} onClick={()=>{setSize(4);setOpened([])}}>4 × 4</button><button className={size===6?"selected":""} onClick={()=>{setSize(6);setOpened([])}}>6 × 6</button></div><label className="field-label">Bombs</label><select className="large-input" value={bombs} onChange={e=>setBombs(+e.target.value)}>{Array.from({length:size*size-1},(_,i)=><option key={i+1}>{i+1}</option>)}</select><BetControls/><button className="secondary-btn full">Cash out</button></>}>
   <div className="game-center"><div className="mines-board" style={{gridTemplateColumns:`repeat(${size},1fr)`}}>{cells.map(i=><button key={i} className={opened.includes(i)?"mine-cell open":"mine-cell"} onClick={()=>setOpened(x=>x.includes(i)?x:[...x,i])}>{opened.includes(i)?<Check size={18}/>:<span>?</span>}</button>)}</div><div className="result-big">1.24x</div><p className="muted">Pick safe tiles, then cash out.</p></div>
 </GameFrame>
}

function Blackjack(){
 const [cards,setCards]=useState(["A♠","9♦"]);
 return <GameFrame side={<><div className="panel-title">Blackjack</div><BetControls/><div className="blackjack-actions"><button>HIT</button><button>STAND</button><button>DOUBLE</button><button>SPLIT</button></div></>}>
   <div className="blackjack-table"><div className="dealer"><span className="field-label">DEALER · 17</span><div className="cards"><Card value="K♣"/><Card value="7♥"/></div></div><div className="table-center"><span>OREOBET</span><small>BLACKJACK</small></div><div className="player"><span className="field-label">YOU · 20</span><div className="cards">{cards.map(c=><Card key={c} value={c}/>)}</div></div></div>
 </GameFrame>
}
function Card({value}:{value:string}){return <div className="playing-card"><span>{value}</span></div>}

function Roulette(){
 const colors=[
  {name:"RED",mult:2,className:"red",weight:49.5},
  {name:"YELLOW",mult:2,className:"yellow",weight:49.5},
  {name:"GREEN",mult:14.7,className:"green",weight:1}
 ];
 const [rolling,setRolling]=useState(false),[cooldown,setCooldown]=useState(0),[win,setWin]=useState(colors[0]);
 const choose=()=>{const total=colors.reduce((a,c)=>a+c.weight,0);let r=Math.random()*total;for(const c of colors){r-=c.weight;if(r<=0)return c}return colors[0]};
 const spin=()=>{
  if(rolling||cooldown>0)return;
  setRolling(true);
  const picked=choose();
  setWin(picked);
  window.setTimeout(()=>{
   setRolling(false);
   setCooldown(5);
   const timer=window.setInterval(()=>setCooldown(v=>{if(v<=1){window.clearInterval(timer);return 0}return v-1}),1000);
  },6200);
 };
 return <GameFrame side={<><div className="panel-title">Roulette</div><div className="payout-list"><div><span className="swatch red-swatch"/>RED</div><strong>2.00x</strong><div><span className="swatch yellow-swatch"/>YELLOW</div><strong>2.00x</strong><div><span className="swatch green-swatch"/>GREEN</div><strong>14.70x</strong></div><BetControls/><div className="muted small-note"><Clock3 size={13}/> {cooldown?`Next round in ${cooldown}s`:'Slow spin · lands on one color'}</div></>}>
   <div className="roulette-stage">
    <div className="roulette-pointer">▼</div>
    <div className={`color-reel ${rolling?"rolling":""}`}>
      {Array.from({length:18},(_,i)=>colors[i%3]).map((c,i)=><div key={i} className={`roulette-color ${c.className}`}><span>{c.name}</span><b>{c.mult}x</b></div>)}
    </div>
    <div className={`roulette-result ${win.className}`}><span>{win.name}</span><b>{win.mult}x</b></div>
    <button className="secondary-btn" onClick={spin} disabled={rolling||cooldown>0}>{rolling?'SPINNING...':cooldown?`WAIT ${cooldown}s`:'SPIN'}</button>
   </div>
 </GameFrame>
}

function Dice(){
 const [rolling,setRolling]=useState(false),[value,setValue]=useState(6);
 const roll=()=>{if(rolling)return;setRolling(true);let ticks=0;const timer=window.setInterval(()=>{setValue(1+Math.floor(Math.random()*6));ticks++;if(ticks>=14){window.clearInterval(timer);setValue(1+Math.floor(Math.random()*6));setRolling(false)}},100)};
 return <GameFrame side={<><div className="panel-title">Dice</div><div className="choice-grid"><button>LOW</button><button>HIGH</button></div><BetControls/><div className="muted small-note">Animated roll with a random final face.</div></>}><div className="game-center"><div className={`dice ${rolling?'dice-rolling':''}`}><span>{value}</span></div><div className="result-big">{value}</div><p className="muted">Roll the dice</p><button className="secondary-btn" onClick={roll}>{rolling?'ROLLING...':'ROLL'}</button></div></GameFrame>
}
