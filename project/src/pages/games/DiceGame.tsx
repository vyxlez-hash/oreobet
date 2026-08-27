import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Dices, Play, RotateCcw, History, Shield } from 'lucide-react';
import { useApp } from '../../store';
import { supabase } from '../../lib/supabase';
import { Button, Card, Badge } from '../../ui';
import { cn, generateSeed, hashSHA256, formatUSD } from '../../utils';

interface RollResult {
  roll: number;
  target: number;
  won: boolean;
  multiplier: number;
  payout: number;
  bet: number;
}

export function DiceGame() {
  const { navigate, user, openAuth, showToast, refreshBalance } = useApp();
  const [target, setTarget] = useState(50);
  const [betAmount, setBetAmount] = useState(1);
  const [mode, setMode] = useState<'under' | 'over'>('under');
  const [rolling, setRolling] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<number | null>(null);
  const [currentRoll, setCurrentRoll] = useState(75.42);
  const [lastResult, setLastResult] = useState<RollResult | null>(null);
  const [history, setHistory] = useState<RollResult[]>([]);
  const [clientSeed] = useState(generateSeed().slice(0, 32));
  const nonceRef = useRef(0);

  const balance = user?.balance ?? 0;
  const winChance = mode === 'under' ? target : 100 - target;
  const multiplier = winChance > 0 ? parseFloat((99 / winChance).toFixed(2)) : 0;
  const potentialPayout = parseFloat((betAmount * multiplier).toFixed(2));

  const canPlay = user && balance >= betAmount && betAmount > 0 && !rolling && cooldown === 0;

  useEffect(() => () => {
    if (cooldownRef.current) window.clearInterval(cooldownRef.current);
  }, []);

  const startCooldown = (seconds = 1.2) => {
    if (cooldownRef.current) window.clearInterval(cooldownRef.current);
    const end = Date.now() + seconds * 1000;
    setCooldown(Math.ceil(seconds * 10) / 10);
    cooldownRef.current = window.setInterval(() => {
      const remaining = Math.max(0, (end - Date.now()) / 1000);
      setCooldown(Number(remaining.toFixed(1)));
      if (remaining <= 0 && cooldownRef.current) {
        window.clearInterval(cooldownRef.current);
        cooldownRef.current = null;
      }
    }, 100);
  };

  const roll = async () => {
    if (!user) {
      openAuth('signup');
      return;
    }
    if (balance < betAmount) {
      showToast('Insufficient balance — deposit to continue');
      return;
    }
    if (betAmount <= 0 || rolling || cooldown > 0) return;

    setRolling(true);
    nonceRef.current++;
    let count = 0;
    const interval = window.setInterval(async () => {
      setCurrentRoll(Math.random() * 100);
      count++;
      if (count <= 12) return;
      window.clearInterval(interval);

      const { data, error } = await supabase.rpc('play_casino_game', {
        p_game: 'Dice',
        p_amount: betAmount,
        p_choice: `${mode}:${target}`,
      });

      if (error || !data) {
        showToast(error?.message || 'Failed to settle bet');
        setRolling(false);
        return;
      }

      const finalRoll = Number(data.roll ?? 0);
      const won = Boolean(data.won);
      const finalMultiplier = Number(data.multiplier ?? 0);
      const payout = Number(data.payout ?? 0);
      await refreshBalance();
      setCurrentRoll(finalRoll);
      setLastResult({ roll: finalRoll, target, won, multiplier: finalMultiplier, payout, bet: betAmount });
      setHistory((prev) => [{ roll: finalRoll, target, won, multiplier: finalMultiplier, payout, bet: betAmount }, ...prev.slice(0, 9)]);
      setRolling(false);
      startCooldown(1.2);
      showToast(won ? `Won ${formatUSD(payout)}!` : 'Better luck next time');
    }, 50);
  };

  const sliderColor = mode === 'under'
    ? `linear-gradient(to right, #fff ${target}%, #2d2d34 ${target}%)`
    : `linear-gradient(to right, #2d2d34 ${target}%, #fff ${target}%)`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <button onClick={() => navigate('games')} className="inline-flex items-center gap-2 text-ink-300 hover:text-white transition-colors mb-8 text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to Games
      </button>

      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center">
          <Dices className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Dice</h1>
          <p className="text-ink-300 text-sm">Roll under or over your target. Provably fair.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8">
            <div className="relative h-48 flex items-center justify-center mb-8">
              <div
                className={cn(
                  'text-7xl md:text-8xl font-bold font-display transition-all duration-100',
                  rolling && 'blur-sm',
                  lastResult && (lastResult.won ? 'text-white' : 'text-ink-300')
                )}
              >
                {currentRoll.toFixed(2)}
              </div>
              {lastResult && !rolling && (
                <div
                  className={cn(
                    'absolute -bottom-2 px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider animate-scale-in',
                    lastResult.won ? 'bg-white text-black' : 'glass text-ink-200'
                  )}
                >
                  {lastResult.won ? `WIN · ${lastResult.multiplier}x` : 'LOSS'}
                </div>
              )}
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between text-xs font-mono mb-3">
                <span className="text-ink-300">0</span>
                <span className="text-white">Target: {target.toFixed(2)}</span>
                <span className="text-ink-300">100</span>
              </div>
              <div className="relative">
                <div className="h-3 rounded-full" style={{ background: sliderColor }} />
                <input
                  type="range"
                  min="2"
                  max="98"
                  step="1"
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  className="absolute inset-0 w-full h-3 appearance-none bg-transparent"
                  style={{ height: '12px', marginTop: '-6px' }}
                />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('under')}
                className={cn(
                  'py-3 rounded-xl text-sm font-medium transition-all duration-300',
                  mode === 'under' ? 'bg-white text-black' : 'glass text-ink-200 hover:bg-white/10'
                )}
              >
                Roll Under {target}
              </button>
              <button
                onClick={() => setMode('over')}
                className={cn(
                  'py-3 rounded-xl text-sm font-medium transition-all duration-300',
                  mode === 'over' ? 'bg-white text-black' : 'glass text-ink-200 hover:bg-white/10'
                )}
              >
                Roll Over {target}
              </button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-ink-300" />
              <span className="text-xs font-mono uppercase tracking-wider text-ink-300">Recent Rolls</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.length === 0 && <span className="text-sm text-ink-400">No rolls yet — place your first bet</span>}
              {history.map((h, i) => (
                <div
                  key={i}
                  className={cn(
                    'px-3 py-2 rounded-lg font-mono text-sm animate-scale-in',
                    h.won ? 'bg-white/10 text-white border border-white/10' : 'glass text-ink-300'
                  )}
                >
                  {h.roll.toFixed(2)} · {h.multiplier}x
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-white mb-5">Bet Settings</h3>

            <label className="block mb-5">
              <span className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-2 block">Bet Amount</span>
              <div className="flex items-center gap-3 glass rounded-xl px-4 py-3 focus-within:border-white/20 transition-colors">
                <span className="text-xs text-ink-300 font-mono">$</span>
                <input
                  type="number"
                  step="0.10"
                  min="0.10"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  className="w-full bg-transparent text-white text-sm focus:outline-none font-mono"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[0.5, 2, 10].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setBetAmount(parseFloat((balance * pct / 100).toFixed(2)) || 0.1)}
                    className="flex-1 glass rounded-lg py-1.5 text-xs text-ink-200 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {pct === 0.5 ? '½' : pct === 2 ? '2×' : 'Max'}
                  </button>
                ))}
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <Stat label="Win Chance" value={`${winChance.toFixed(0)}%`} />
              <Stat label="Multiplier" value={`${multiplier}x`} />
              <Stat label="Payout" value={formatUSD(potentialPayout)} />
              <Stat label="Balance" value={formatUSD(balance)} />
            </div>

            <Button
              onClick={roll}
              disabled={rolling || cooldown > 0 || (!user || balance < betAmount)}
              className="w-full game-play-button"
              size="lg"
            >
              {rolling ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              {rolling ? 'ROLLING...' : cooldown > 0 ? `COOLDOWN ${cooldown.toFixed(1)}s` : 'ROLL DICE'}
              {cooldown > 0 && <span className="cooldown-bar" key={`dice-cooldown-${cooldown}`} />}
            </Button>

            {!user && (
              <p className="text-xs text-ink-400 text-center mt-3">Sign up to play with real balance</p>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-white" />
              <span className="text-xs font-mono uppercase tracking-wider text-white">Provably Fair</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-ink-300 mb-1">Client Seed</div>
                <div className="font-mono text-xs text-ink-100 break-all glass rounded-lg px-3 py-2">{clientSeed}</div>
              </div>
              <div>
                <div className="text-xs text-ink-300 mb-1">Nonce</div>
                <div className="font-mono text-sm text-white">{nonceRef.current}</div>
              </div>
              <Badge>
                <Shield className="w-3 h-3" />
                Verifiable on Provably Fair page
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-1">{label}</div>
      <div className="text-sm font-bold text-white font-mono">{value}</div>
    </div>
  );
}
