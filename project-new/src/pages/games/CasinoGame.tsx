import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bomb, Coins, Disc3, Rocket, Shield, Spade, Sparkles, Play, RotateCcw } from 'lucide-react';
import { useApp } from '../../store';
import { supabase } from '../../lib/supabase';
import { Button, Card } from '../../ui';
import { cn, formatUSD } from '../../utils';
import type { GameId } from '../../types';
import { games } from '../../data';

type Result = { won?: boolean; payout?: number; multiplier?: number; side?: string; color?: string; crash_point?: number; status?: string; player_cards?: CardData[]; dealer_cards?: CardData[]; player_total?: number; dealer_total?: number; current_bet?: number; cell?: number; };
type CardData = { rank:string; suit:string; value:number };

export function CasinoGame({ gameId }: { gameId: Exclude<GameId,'dice'> }) {
  const { navigate, user, openAuth, showToast, refreshBalance } = useApp();
  const game = games.find(g=>g.id===gameId)!;
  const [bet,setBet]=useState(1); const [busy,setBusy]=useState(false); const [cooldown,setCooldown]=useState(0); const timer=useRef<number | undefined>(undefined);
  const [result,setResult]=useState<Result|null>(null);
  const [choice,setChoice]=useState(gameId==='coinflip'?'heads':gameId==='roulette'?'red':'');
  const [mineCount,setMineCount]=useState(3); const [cell,setCell]=useState<number|null>(null);
  const [bjHand,setBjHand]=useState<Result|null>(null); const [bjId,setBjId]=useState<string|null>(null);
  const [crashId,setCrashId]=useState<string|null>(null); const [crashPoint,setCrashPoint]=useState(0); const [crashX,setCrashX]=useState(1); const [crashRunning,setCrashRunning]=useState(false);
  const [rouletteTick,setRouletteTick]=useState(0); const [rouletteOutcome,setRouletteOutcome]=useState('red'); const [rouletteTarget,setRouletteTarget]=useState('red'); const [rouletteBet,setRouletteBet]=useState(1); const [rouletteArmed,setRouletteArmed]=useState(false); const [rouletteBusy,setRouletteBusy]=useState(false); const [roulettePhase,setRoulettePhase]=useState<'betting'|'spinning'|'cooldown'>('betting'); const [rouletteTimer,setRouletteTimer]=useState(5); const [coinMatches,setCoinMatches]=useState<any[]>([]); const [coinLoading,setCoinLoading]=useState(false); const [coinSide,setCoinSide]=useState<'heads'|'tails'>('heads');

  useEffect(()=>()=>{ if(timer.current) clearInterval(timer.current); },[]);
  const startCooldown=(seconds:number)=>{ if(timer.current) clearInterval(timer.current); const end=Date.now()+seconds*1000; setCooldown(seconds); timer.current=window.setInterval(()=>{const r=Math.max(0,(end-Date.now())/1000);setCooldown(Number(r.toFixed(1)));if(r<=0){clearInterval(timer.current!);timer.current=undefined;}},100); };
  const canPlay=Boolean(user)&&!busy&&cooldown<=0;

  const playSimple=async(extra?:string)=>{
    if(!user){openAuth('signup');return;} if(!canPlay)return;
    if(bet<1||bet>user.balance){showToast('Insufficient balance.');return;}
    setBusy(true);setResult(null);
    const selected=extra??(gameId==='mines'?`${mineCount}:${cell??Math.floor(Math.random()*25)}`:choice);
    const {data,error}=await supabase.rpc('play_casino_game',{p_game:game.name,p_amount:bet,p_choice:selected});
    if(error){setBusy(false);showToast(error.message);return;}
    const delay=gameId==='coinflip'?1300:gameId==='mines'?850:700;
    window.setTimeout(async()=>{setResult(data);setBusy(false);startCooldown(gameId==='mines'?1.5:1.2);await refreshBalance();showToast(data.won?`Won ${formatUSD(Number(data.payout))}!`:`Lost ${formatUSD(bet)}.`)},delay);
  };

  const startBJ=async()=>{if(!user){openAuth('signup');return;}if(cooldown>0||bjHand?.status==='active')return;if(bet<1||bet>user.balance){showToast('Insufficient balance.');return;}setBusy(true);const {data,error}=await supabase.rpc('blackjack_start',{p_amount:bet});setBusy(false);if(error){showToast(error.message);return;}setBjId(data.id);setBjHand(data);setResult(null);await refreshBalance();};
  const bjAction=async(action:'hit'|'double'|'stand')=>{if(!bjId||bjHand?.status!=='active'||busy)return;setBusy(true);const {data,error}=await supabase.rpc('blackjack_action',{p_hand:bjId,p_action:action});setBusy(false);if(error){showToast(error.message);return;}setBjHand(data);if(data.status!=='active'){await refreshBalance();startCooldown(2);showToast(data.status==='won'?`Blackjack win ${formatUSD(Number(data.payout))}`:data.status==='push'?'Push — bet returned':'Blackjack loss');}};

  const startCrash=async()=>{if(!user){openAuth('signup');return;}if(cooldown>0||crashRunning)return;if(bet<1||bet>user.balance){showToast('Insufficient balance.');return;}setBusy(true);const {data,error}=await supabase.rpc('crash_start',{p_amount:bet});setBusy(false);if(error){showToast(error.message);return;}setCrashId(data.id);setCrashPoint(Number(data.crash_point));setCrashX(1);setCrashRunning(true);setResult(null);await refreshBalance();};
  const cashout=async()=>{if(!crashId||!crashRunning)return;setBusy(true);const {data,error}=await supabase.rpc('crash_cashout',{p_id:crashId,p_multiplier:crashX});setBusy(false);if(error){showToast(error.message);return;}setCrashRunning(false);setResult(data);await refreshBalance();startCooldown(2);showToast(data.status==='cashed'?`Cashed out ${formatUSD(Number(data.payout))}`:'CRASHED — bet lost');};

  useEffect(()=>{if(!crashRunning)return;const id=window.setInterval(()=>{setCrashX(x=>{const next=Number((x+0.03+Math.pow(x,1.15)*0.008).toFixed(2));if(next>=crashPoint){clearInterval(id);setCrashRunning(false);setResult({status:'crashed',won:false,crash_point:crashPoint});showToast(`Crashed at ${crashPoint.toFixed(2)}x`);startCooldown(2);supabase.rpc('crash_cashout',{p_id:crashId!,p_multiplier:crashPoint+0.01}).then(()=>refreshBalance());return crashPoint;}return next;});},50);return()=>clearInterval(id)},[crashRunning,crashPoint,crashId,showToast,refreshBalance]);

  const loadCoinMatches=async()=>{
    if(gameId!=='coinflip')return;
    const {data}=await supabase.from('coinflip_matches').select('id,creator_id,creator_side,amount,status,created_at,profiles:creator_id(username,avatar_url)').eq('status','open').order('created_at',{ascending:false}).limit(20);
    setCoinMatches(data||[]);
  };
  useEffect(()=>{ if(gameId==='coinflip'){loadCoinMatches(); const id=window.setInterval(loadCoinMatches,2500); return()=>clearInterval(id);} },[gameId]);
  const createCoinMatch=async()=>{
    if(!user){openAuth('signup');return;} if(bet<1||bet>user.balance){showToast('Minimum $1 and insufficient balance.');return;}
    setCoinLoading(true); const {error}=await supabase.rpc('create_coinflip_match',{p_amount:bet,p_side:coinSide}); setCoinLoading(false);
    if(error){showToast(error.message);return;} await refreshBalance(); await loadCoinMatches(); showToast('Coinflip created — waiting for opponent.');
  };
  const joinCoinMatch=async(id:string)=>{
    if(!user){openAuth('signup');return;} setCoinLoading(true); const {data,error}=await supabase.rpc('join_coinflip_match',{p_match:id});
    if(error){setCoinLoading(false);showToast(error.message);return;} await refreshBalance(); await loadCoinMatches(); setResult(data); showToast(data.winner_id===user.id?'You won the PvP coinflip!':'You lost the PvP coinflip.'); window.setTimeout(()=>setCoinLoading(false),1800);
  };
  const cancelCoinMatch=async(id:string)=>{setCoinLoading(true);const {error}=await supabase.rpc('cancel_coinflip_match',{p_match:id});setCoinLoading(false);if(error)showToast(error.message);else{await refreshBalance();await loadCoinMatches();showToast('Coinflip cancelled and refunded.')}};

  const runRouletteSpin=async()=>{
    if(rouletteBusy)return;
    setRouletteBusy(true); setRoulettePhase('spinning'); setRouletteTimer(0); setRouletteTick(t=>t+1);
    let target='red'; let data:any=null;
    const hasBet=Boolean(user)&&rouletteArmed&&rouletteBet>=1;
    if(hasBet){
      if(rouletteBet>Number(user?.balance||0)){showToast('Insufficient balance for roulette bet.');setRouletteBusy(false);setRoulettePhase('betting');setRouletteTimer(5);setRouletteArmed(false);return;}
      const res=await supabase.rpc('play_roulette',{p_amount:rouletteBet,p_color:choice});
      if(res.error){showToast(res.error.message);setRouletteBusy(false);setRoulettePhase('betting');setRouletteTimer(5);return;}
      data=res.data; target=String(data.color); setResult(data); setRouletteArmed(false); await refreshBalance();
    } else {
      const r=Math.random(); target=r<0.483?'red':r<0.966?'yellow':'green'; setResult(null);
    }
    setRouletteTarget(target);
    window.setTimeout(()=>setRouletteOutcome(target),3500);
    window.setTimeout(()=>{
      setRouletteBusy(false); setRoulettePhase('cooldown'); setRouletteTimer(5);
      const end=Date.now()+5000;
      const id=window.setInterval(()=>{const left=Math.max(0,Math.ceil((end-Date.now())/1000));setRouletteTimer(left);if(left<=0){clearInterval(id);setRoulettePhase('betting');setRouletteTimer(5);}},250);
    },4300);
  };

  // Initialize roulette only when entering the roulette page. Do not depend on
  // phase/busy here: doing so reset the phase after every state transition and
  // made the reel/name visibly jump or slide back to the beginning.
  useEffect(()=>{
    if(gameId!=='roulette')return;
    setRoulettePhase('betting');
    setRouletteTimer(5);
    setRouletteBusy(false);
    setRouletteArmed(false);
  },[gameId]);

  useEffect(()=>{
    if(gameId!=='roulette'||roulettePhase!=='betting')return;
    setRouletteTimer(5);
    const tick=window.setInterval(()=>setRouletteTimer(t=>Math.max(0,t-1)),1000);
    const id=window.setTimeout(()=>{if(!rouletteBusy)runRouletteSpin()},5000);
    return()=>{clearInterval(tick);clearTimeout(id)};
  },[gameId,roulettePhase,rouletteBusy]);

  const detail=useMemo(()=>result?.color?String(result.color).toUpperCase():result?.side?String(result.side).toUpperCase():'',[result]);

  return <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
    <button onClick={()=>navigate('games')} className="inline-flex items-center gap-2 text-ink-300 hover:text-white mb-8 text-sm"><ArrowLeft className="w-4 h-4"/>Back to Games</button>
    <div className="flex items-center gap-4 mb-10"><div className="w-14 h-14 rounded-2xl glass flex items-center justify-center"><GameIcon gameId={gameId}/></div><div><h1 className="text-3xl font-bold text-white">{game.name}</h1><p className="text-ink-300 text-sm">{game.description}</p></div></div>
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 p-6 md:p-8 min-h-[560px] flex flex-col overflow-hidden"><div className="flex-1 flex flex-col items-center justify-center relative">
        {gameId==='roulette'&&<RouletteVisual busy={rouletteBusy} outcome={rouletteOutcome} target={rouletteTarget} phase={roulettePhase} timer={rouletteTimer}/>} 
        {gameId==='blackjack'&&<BlackjackVisual hand={bjHand} busy={busy}/>} 
        {gameId==='crash'&&<CrashVisual running={crashRunning} x={crashX} result={result}/>} 
        {gameId==='coinflip'&&<CoinVisual busy={coinLoading} result={result}/>} 
        {gameId==='mines'&&<MinesVisual mineCount={mineCount} setMineCount={setMineCount} cell={cell} setCell={setCell} busy={busy} result={result}/>} 
        {showSimple(gameId)&&<div className="text-center"><div className="text-6xl font-bold text-white mb-5">{result?.won?'WIN':'READY'}</div><p className="text-ink-300">{detail||'Choose your side and start the round.'}</p></div>}
        {result&&gameId!=='roulette'&&gameId!=='blackjack'&&gameId!=='crash'&&<ResultPill result={result}/>} 
      </div><div className="flex items-center gap-2 text-xs text-ink-400"><Shield className="w-4 h-4"/>Server-settled · balance changes are atomic</div></Card>
      <Card className="p-6"><h3 className="font-bold text-white mb-5">Game Controls</h3>
        <label className="block mb-5"><span className="text-xs font-mono uppercase tracking-wider text-ink-300">Bet Amount</span><div className="flex mt-2"><input value={bet} onChange={e=>setBet(Math.max(0,Number(e.target.value)||0))} type="number" min="1" step="0.5" className="w-full glass rounded-l-xl px-4 py-3.5 bg-transparent text-white outline-none"/><button onClick={()=>setBet(1)} className="glass px-3 text-xs">MIN</button></div></label>
        {gameId==='roulette'&&<RouletteControls choice={choice} setChoice={setChoice} bet={rouletteBet} setBet={setRouletteBet} armed={rouletteArmed} setArmed={setRouletteArmed} spinning={rouletteBusy} phase={roulettePhase} timer={rouletteTimer} onArm={()=>setRouletteArmed(true)}/>} 
        {gameId==='blackjack'&&<div className="space-y-3"><Button className="w-full" size="lg" disabled={busy||cooldown>0||bjHand?.status==='active'} onClick={startBJ}>{bjHand?.status==='active'?'HAND ACTIVE':'DEAL HAND'}</Button>{bjHand?.status==='active'&&<><div className="grid grid-cols-3 gap-2"><Button variant="outline" disabled={busy} onClick={()=>bjAction('hit')}>HIT</Button><Button variant="outline" disabled={busy||Number(bjHand.current_bet||bet)*2>Number(user?.balance||0)+Number(bjHand.current_bet||0)} onClick={()=>bjAction('double')}>DOUBLE</Button><Button variant="outline" disabled={busy} onClick={()=>bjAction('stand')}>STAND</Button></div><p className="text-xs text-ink-400 text-center">Hit, double, or stand manually. Dealer plays after Stand.</p></>}</div>}
        {gameId==='crash'&&<div><div className="grid grid-cols-2 gap-2"><Button className="w-full" size="lg" disabled={crashRunning||cooldown>0||busy} onClick={startCrash}><Rocket className="w-4 h-4"/>{crashRunning?'ROCKET FLYING':'BET & LAUNCH'}</Button><Button variant="outline" size="lg" disabled={!crashRunning||busy} onClick={cashout}>CASH OUT</Button></div><p className="text-xs text-ink-400 mt-3 text-center">Cash out before the rocket crashes. Multiplier is live.</p></div>}
        {gameId==='coinflip'&&<CoinflipLobby bet={bet} setBet={setBet} side={coinSide} setSide={setCoinSide} matches={coinMatches} loading={coinLoading} onCreate={createCoinMatch} onJoin={joinCoinMatch} onCancel={cancelCoinMatch} userId={user?.id}/>}
        {gameId==='mines'&&<><div className="grid grid-cols-4 gap-2 mb-4">{[1,3,5,10].map(n=><ChoiceButton key={n} active={mineCount===n} onClick={()=>setMineCount(n)}>{n} MINES</ChoiceButton>)}</div><div className="grid grid-cols-5 gap-1 mb-4">{Array.from({length:25},(_,i)=><button key={i} onClick={()=>setCell(i)} className={cn('h-8 rounded-lg glass text-xs',cell===i&&'bg-white text-black')}>{i+1}</button>)}</div></>}
        {gameId==='mines'&&<Button className="w-full" size="lg" disabled={!canPlay} onClick={()=>playSimple()}>{cooldown>0?`COOLDOWN ${cooldown.toFixed(1)}s`:busy?'PLAYING...':'PLAY ROUND'}</Button>}
        {cooldown>0&&gameId!=='roulette'&&<div className="text-center text-xs font-mono text-ink-500 mt-3">Next round available in {cooldown.toFixed(1)}s</div>}
      </Card>
    </div>
  </div>;
}

function showSimple(id:GameId){return id!=='roulette'&&id!=='blackjack'&&id!=='crash'&&id!=='coinflip'&&id!=='mines'}
function GameIcon({gameId}:{gameId:GameId}){const C=gameId==='crash'?Rocket:gameId==='roulette'?Disc3:gameId==='blackjack'?Spade:gameId==='mines'?Bomb:Coins;return <C className="w-7 h-7 text-white"/>}
function ResultPill({result}:{result:Result}){return <div className={cn('mt-8 px-5 py-2.5 rounded-full text-xs font-mono uppercase result-reveal',result.won?'bg-white text-black':'glass text-ink-200')}>{result.won?`WIN · ${Number(result.multiplier||1).toFixed(2)}x`:'LOSS'}</div>}
function ChoiceButton({active,onClick,children}:{active:boolean;onClick:()=>void;children:React.ReactNode}){return <button onClick={onClick} className={cn('rounded-xl py-3 text-xs font-mono border transition-all',active?'bg-white text-black border-white':'glass text-ink-200 border-white/10 hover:bg-white/10')}>{children}</button>}

function CoinVisual({busy,result}:{busy:boolean;result:Result|null}){return <div className="coin-pvp-hero relative z-10"><div className="coin-stage"><div className={cn('coin-3d',busy&&'coin-3d-flip')}><div className="coin-face-3d heads">H</div><div className="coin-face-3d tails">T</div></div></div>{result&&<div className="mt-6 text-center text-sm font-mono text-ink-200 result-reveal">LANDED ON <span className="text-white font-bold">{String(result.result_side||result.side||'').toUpperCase()}</span></div>}</div>}
function CoinflipLobby({bet,setBet,side,setSide,matches,loading,onCreate,onJoin,onCancel,userId}:{bet:number;setBet:(n:number)=>void;side:'heads'|'tails';setSide:(s:'heads'|'tails')=>void;matches:any[];loading:boolean;onCreate:()=>void;onJoin:(id:string)=>void;onCancel:(id:string)=>void;userId?:string}){return <div className="w-full max-w-2xl"><div className="coin-pvp-panel"><div className="flex items-center justify-between mb-4"><div><div className="text-xs uppercase tracking-[.25em] text-ink-400">PVP COINFLIP</div><div className="text-2xl font-bold text-white mt-1">Challenge another player</div></div><Coins className="w-7 h-7 text-white/60"/></div><div className="grid grid-cols-2 gap-2 mb-4"><ChoiceButton active={side==='heads'} onClick={()=>setSide('heads')}>HEADS</ChoiceButton><ChoiceButton active={side==='tails'} onClick={()=>setSide('tails')}>TAILS</ChoiceButton></div><div className="grid grid-cols-[1fr_auto] gap-2"><input type="number" min="1" value={bet} onChange={e=>setBet(Math.max(1,Number(e.target.value)||1))} className="glass rounded-xl px-4 py-3 bg-transparent text-white outline-none"/><Button disabled={loading} onClick={onCreate}>{loading?'CREATING...':'CREATE FLIP'}</Button></div></div><div className="mt-5 flex items-center justify-between"><h4 className="text-sm font-bold text-white">OPEN FLIPS</h4><span className="text-xs text-ink-500">Stake is locked until joined/cancelled</span></div><div className="mt-3 space-y-2 max-h-64 overflow-auto">{matches.length===0?<div className="glass rounded-xl p-5 text-center text-sm text-ink-400">No open flips yet. Create the first one.</div>:matches.map(m=><div key={m.id} className="glass rounded-xl p-3 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-white">{m.creator_side==='heads'?'H':'T'}</div><div className="min-w-0 flex-1"><div className="text-sm text-white font-semibold truncate">{m.profiles?.username||'Player'}</div><div className="text-xs text-ink-500">{String(m.creator_side).toUpperCase()} · ${Number(m.amount).toFixed(2)}</div></div>{m.creator_id===userId?<Button variant="outline" size="sm" disabled={loading} onClick={()=>onCancel(m.id)}>CANCEL</Button>:<Button size="sm" disabled={loading} onClick={()=>onJoin(m.id)}>JOIN ${Number(m.amount).toFixed(2)}</Button>}</div>)}</div></div>}

function RouletteVisual({busy,outcome,target,phase,timer}:{busy:boolean;outcome:string;target:string;phase:'betting'|'spinning'|'cooldown';timer:number}){const pattern=['red','yellow','red','yellow','red','yellow','green','red','yellow','red','yellow','red','yellow','green','red','yellow','red','yellow','red','yellow','red','yellow','green','red','yellow','red','yellow','red'];const targetIndex=pattern.indexOf(target);return <div className="w-full max-w-2xl relative z-10"><div className="text-center mb-5"><div className="text-xs uppercase tracking-[.3em] text-ink-400">{phase==='betting'?'BETTING OPEN':phase==='spinning'?'SPINNING':'NEXT SPIN IN'}</div><div className="text-5xl font-bold text-white mt-2 tabular-nums">{phase==='cooldown'?`${timer}s`:phase==='betting'?`${timer}s`:(outcome||'—').toUpperCase()}</div></div><div className="roulette-reel-window"><div className="roulette-pointer-top"/><div className={cn('roulette-reel',busy&&'roulette-reel-spin')} style={{'--roulette-target':targetIndex} as React.CSSProperties}>{[...pattern,...pattern,...pattern,...pattern].map((c,i)=><div key={i} className={cn('roulette-tile',c)}>{c==='green'?'14.7x':'2x'}</div>)}</div><div className="roulette-pointer-bottom"/></div><div className="flex justify-center gap-2 mt-5 text-xs font-mono"><span className="px-3 py-2 rounded-lg bg-red-500/20 text-red-200">RED · 2x</span><span className="px-3 py-2 rounded-lg bg-yellow-400/20 text-yellow-200">YELLOW · 2x</span><span className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-200">GREEN · 14.7x</span></div></div>}

function RouletteControls({choice,setChoice,bet,setBet,armed,setArmed,spinning,phase,timer,onArm}:{choice:string;setChoice:(v:string)=>void;bet:number;setBet:(v:number)=>void;armed:boolean;setArmed:(v:boolean)=>void;spinning:boolean;phase:'betting'|'spinning'|'cooldown';timer:number;onArm:()=>void}){return <><div className="grid grid-cols-3 gap-2 mb-4">{['red','yellow','green'].map(c=><button key={c} disabled={phase!=='betting'} onClick={()=>setChoice(c)} className={cn('rounded-xl p-3 border text-xs font-mono uppercase transition-all',choice===c?'bg-white text-black':'glass text-ink-200 border-white/10',phase!=='betting'&&'opacity-40')}>{c}<div className="mt-1 font-bold">{c==='green'?'14.7x':'2x'}</div></button>)}</div><label className="block mb-3"><span className="text-xs text-ink-400 uppercase font-mono">Bet for the next spin</span><input disabled={phase!=='betting'} type="number" min="1" value={bet} onChange={e=>setBet(Number(e.target.value)||0)} className="mt-2 w-full glass rounded-xl px-4 py-3 bg-transparent text-white outline-none disabled:opacity-40"/></label><Button className="w-full" size="lg" disabled={phase!=='betting'||spinning||bet<1} onClick={onArm}>{phase==='betting'?(armed?'BET LOCKED · SPINNING SOON':'PLACE BET'):(phase==='spinning'?'SPINNING...':`NEXT SPIN ${timer}s`)}</Button><p className="text-[11px] text-ink-500 mt-3 text-center">Bets lock when the 5-second betting window closes. Every round spins automatically.</p></>}

function BlackjackVisual({hand,busy}:{hand:Result|null;busy:boolean}){if(!hand)return <div className="text-center"><Spade className="w-16 h-16 mx-auto text-white/30 mb-4"/><div className="text-3xl font-bold text-white">BLACKJACK</div><p className="text-ink-400 mt-2">Deal a hand to begin.</p></div>;return <div className="w-full max-w-2xl space-y-8"><Hand title="DEALER" cards={hand.dealer_cards||[]} total={hand.dealer_total}/><div className="h-px bg-white/5"/><Hand title={`YOU · ${hand.current_bet?formatUSD(Number(hand.current_bet)):''}`} cards={hand.player_cards||[]} total={hand.player_total}/>{busy&&<div className="text-center text-xs font-mono text-ink-400 animate-pulse">DEALING...</div>}{hand.status&&hand.status!=='active'&&<div className="text-center text-2xl font-bold text-white uppercase result-reveal">{hand.status}</div>}</div>}
function Hand({title,cards,total}:{title:string;cards:CardData[];total?:number}){return <div><div className="flex justify-between text-xs font-mono text-ink-400 mb-3"><span>{title}</span><span>{total??'?'}</span></div><div className="flex gap-2 flex-wrap">{cards.map((c,i)=><div key={i} className="w-16 h-24 rounded-xl bg-white text-black flex flex-col items-center justify-center shadow-xl animate-card-deal"><span className="font-bold text-lg">{c.rank}</span><span className={c.suit==='♥'||c.suit==='♦'?'text-red-500':''}>{c.suit}</span></div>)}</div></div>}
function CrashVisual({running,x,result}:{running:boolean;x:number;result:Result|null}){return <div className="w-full max-w-2xl h-72 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[.03] to-black"><div className="absolute inset-0 crash-grid"/><div className="absolute bottom-10 left-8 right-8 h-px bg-white/10"/><div className="absolute left-8 bottom-10 text-6xl font-bold text-white tabular-nums">{x.toFixed(2)}x</div><div className="absolute" style={{left:`${Math.min(88,5+(Math.log(x)/Math.log(100))*75)}%`,bottom:`${Math.min(70,10+(Math.log(x)/Math.log(100))*55)}%`}}><Rocket className={cn('w-14 h-14 text-white',running&&'rocket-fly')}/></div>{result&&<div className="absolute top-5 right-5 rounded-full glass px-4 py-2 text-xs font-mono">{result.status==='cashed'?`CASHED ${Number(result.payout||0).toFixed(2)}`:'CRASHED'}</div>}</div>}
function MinesVisual({mineCount,setMineCount,cell,setCell,busy,result}:{mineCount:number;setMineCount:(n:number)=>void;cell:number|null;setCell:(n:number)=>void;busy:boolean;result:Result|null}){return <div className="text-center"><div className="grid grid-cols-5 gap-2">{Array.from({length:25},(_,i)=><button key={i} onClick={()=>!busy&&setCell(i)} className={cn('w-12 h-12 rounded-xl glass text-ink-400',cell===i&&'bg-white text-black',result?.cell===i&&(result.won?'bg-white text-black':'bg-red-500/40'))}>{result?.cell===i?(result.won?'◆':'✕'):'•'}</button>)}</div><div className="mt-5 text-xs font-mono text-ink-400">{mineCount} mines · choose a tile</div></div>}
