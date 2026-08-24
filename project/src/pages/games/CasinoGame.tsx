import { useState } from 'react';
import * as Icons from 'lucide-react';
import { ArrowLeft, Play, RotateCcw, Shield, Bomb, Coins, Rocket, Disc3, Spade } from 'lucide-react';
import { useApp } from '../../store';
import { supabase } from '../../lib/supabase';
import { Button, Card, Badge } from '../../ui';
import { cn, formatUSD } from '../../utils';
import type { GameId } from '../../types';
import { games } from '../../data';

export function CasinoGame({ gameId }: { gameId: Exclude<GameId, 'dice'> }) {
  const { navigate, user, openAuth, showToast, refreshBalance } = useApp();
  const game = games.find(g => g.id === gameId)!;
  const [bet, setBet] = useState(1);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [choice, setChoice] = useState(gameId === 'coinflip' ? 'heads' : gameId === 'roulette' ? 'red' : gameId === 'crash' ? '2.00' : '');
  const [mineCount, setMineCount] = useState(3);
  const [cell, setCell] = useState<number | null>(null);

  const play = async (extraChoice?: string) => {
    if (!user) return openAuth('signup');
    if (bet <= 0 || bet > user.balance) return showToast('Insufficient balance.');
    setBusy(true);
    const selected = extraChoice ?? (gameId === 'mines' ? `${mineCount}:${cell ?? Math.floor(Math.random()*25)}` : choice);
    const { data, error } = await supabase.rpc('play_casino_game', { p_game: game.name, p_amount: bet, p_choice: selected });
    setBusy(false);
    if (error) return showToast(error.message);
    setResult(data);
    await refreshBalance();
    showToast(data.won ? `Won ${formatUSD(Number(data.payout))}!` : `Lost ${formatUSD(bet)}.`);
  };

  const detail = result?.player_total ? `You ${result.player_total} · Dealer ${result.dealer_total}` : result?.side ? result.side.toUpperCase() : result?.number !== undefined ? `Number ${result.number}` : result?.crash ? `Crashed at ${Number(result.crash).toFixed(2)}x` : result?.cell !== undefined ? `Cell ${Number(result.cell)+1}` : '';

  return <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
    <button onClick={() => navigate('games')} className="inline-flex items-center gap-2 text-ink-300 hover:text-white transition-colors mb-8 text-sm"><ArrowLeft className="w-4 h-4"/>Back to Games</button>
    <div className="flex items-center gap-4 mb-10">
      <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center"><GameIcon gameId={gameId}/></div>
      <div><h1 className="text-3xl font-bold text-white">{game.name}</h1><p className="text-ink-300 text-sm">{game.description}</p></div>
    </div>

    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 p-8 min-h-[430px] flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center">
          {gameId === 'coinflip' && <div className="w-36 h-36 rounded-full border border-white/10 glass flex items-center justify-center text-3xl font-display font-bold text-white mb-8">{result?.side ? result.side[0].toUpperCase() : '?'}</div>}
          {gameId === 'crash' && <div className="text-7xl font-display font-bold text-white mb-8">{result?.crash ? `${Number(result.crash).toFixed(2)}x` : '1.00x'}</div>}
          {gameId === 'blackjack' && <div className="text-center mb-8"><div className="text-6xl font-display font-bold text-white">{result?.player_total ?? '??'}</div><div className="text-sm text-ink-400 mt-2">Your total</div>{result?.dealer_total && <div className="mt-4 text-ink-200">Dealer: {result.dealer_total}</div>}</div>}
          {gameId === 'roulette' && <div className="w-44 h-44 rounded-full border-8 border-white/10 flex items-center justify-center text-6xl font-display font-bold text-white mb-8">{result?.number ?? '?'}</div>}
          {gameId === 'mines' && <div className="grid grid-cols-5 gap-2 mb-8">{Array.from({length:25},(_,i)=><button key={i} onClick={()=>setCell(i)} className={cn('w-12 h-12 rounded-xl glass transition-all hover:bg-white/10 text-ink-400', cell===i && 'bg-white text-black')}>{result && result.cell===i ? (result.won ? '◆' : '✕') : '•'}</button>)}</div>}
          {gameId !== 'mines' && result && <div className={cn('px-5 py-2 rounded-full text-xs font-mono uppercase', result.won ? 'bg-white text-black' : 'glass text-ink-200')}>{result.won ? `WIN · ${Number(result.multiplier).toFixed(2)}x` : 'LOSS'} {detail && ` · ${detail}`}</div>}
          {gameId === 'mines' && result && <div className={cn('px-5 py-2 rounded-full text-xs font-mono uppercase', result.won ? 'bg-white text-black' : 'glass text-ink-200')}>{result.won ? `SAFE · ${Number(result.multiplier).toFixed(2)}x` : 'MINE · LOSS'}</div>}
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-400"><Shield className="w-4 h-4"/>Server-settled round · Balance and bet are recorded atomically</div>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold text-white mb-5">Bet Settings</h3>
        <label className="block mb-5"><span className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-2 block">Bet Amount</span><div className="flex items-center gap-3 glass rounded-xl px-4 py-3"><span className="text-xs text-ink-300">$</span><input type="number" min="0.10" step="0.10" value={bet} onChange={e=>setBet(Math.max(.1,Number(e.target.value)||.1))} className="w-full bg-transparent text-white outline-none font-mono"/></div></label>

        {gameId === 'coinflip' && <div className="grid grid-cols-2 gap-2 mb-5">{['heads','tails'].map(v=><button key={v} onClick={()=>setChoice(v)} className={cn('py-3 rounded-xl uppercase text-xs font-mono',choice===v?'bg-white text-black':'glass text-ink-200')}>{v}</button>)}</div>}
        {gameId === 'roulette' && <div className="mb-5"><div className="grid grid-cols-3 gap-2 mb-3">{['red','black','0'].map(v=><button key={v} onClick={()=>setChoice(v)} className={cn('py-3 rounded-xl uppercase text-xs font-mono',choice===v?'bg-white text-black':'glass text-ink-200')}>{v}</button>)}</div><select value={choice} onChange={e=>setChoice(e.target.value)} className="w-full glass rounded-xl px-4 py-3 bg-transparent text-white"><option value="red">Red</option><option value="black">Black</option>{Array.from({length:37},(_,i)=><option key={i} value={String(i)}>Number {i}</option>)}</select></div>}
        {gameId === 'crash' && <label className="block mb-5"><span className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-2 block">Auto Cashout</span><input type="number" min="1.2" max="50" step="0.1" value={choice} onChange={e=>setChoice(e.target.value)} className="w-full glass rounded-xl px-4 py-3 bg-transparent text-white outline-none"/></label>}
        {gameId === 'mines' && <label className="block mb-5"><span className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-2 block">Mines</span><input type="range" min="1" max="24" value={mineCount} onChange={e=>setMineCount(Number(e.target.value))} className="w-full"/><div className="text-center text-white mt-2">{mineCount} mines</div></label>}

        <div className="grid grid-cols-2 gap-3 mb-6"><Stat label="Balance" value={formatUSD(user?.balance ?? 0)}/><Stat label="Max Bet" value={formatUSD(game.maxBet)}/></div>
        <Button onClick={()=>play()} disabled={busy || !user || (user?.balance ?? 0)<bet} className="w-full" size="lg">{busy?<RotateCcw className="w-5 h-5 animate-spin"/>:<Play className="w-5 h-5"/>}{busy?'PLAYING...':gameId==='mines'?'REVEAL TILE':'PLAY ROUND'}</Button>
        {!user && <p className="text-xs text-ink-400 text-center mt-3">Sign up to play with your balance.</p>}
      </Card>
    </div>
  </div>;
}

function GameIcon({gameId}:{gameId:Exclude<GameId,'dice'>}) {
  const props={className:'w-7 h-7 text-white'};
  if(gameId==='crash') return <Rocket {...props}/>;
  if(gameId==='roulette') return <Disc3 {...props}/>;
  if(gameId==='blackjack') return <Spade {...props}/>;
  if(gameId==='coinflip') return <Coins {...props}/>;
  return <Bomb {...props}/>;
}
function Stat({label,value}:{label:string;value:string}){return <div className="glass rounded-xl p-4"><div className="text-[10px] uppercase tracking-wider font-mono text-ink-400 mb-1">{label}</div><div className="text-sm font-bold text-white">{value}</div></div>}
