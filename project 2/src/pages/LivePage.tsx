import { useState, useEffect, useRef } from 'react';
import { Trophy, Flame, Activity } from 'lucide-react';
import { SectionTitle, Card, Badge } from '../ui';
import { generateLiveBets, generateHighRollers } from '../data';
import type { BetRecord } from '../types';
import { cn, formatUSD } from '../utils';

type Tab = 'all' | 'highrollers';

export function LivePage() {
  const [tab, setTab] = useState<Tab>('all');
  const [bets, setBets] = useState<BetRecord[]>(() => generateLiveBets(30));
  const [highRollers, setHighRollers] = useState<BetRecord[]>(() => generateHighRollers(15));
  const tickRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current++;
      setBets((prev) => [generateLiveBets(1)[0], ...prev.slice(0, 29)]);
      if (tickRef.current % 3 === 0) {
        setHighRollers((prev) => [generateHighRollers(1)[0], ...prev.slice(0, 14)]);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const display = tab === 'all' ? bets : highRollers;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <SectionTitle
        eyebrow="Live Feed"
        title="Live Bets"
        subtitle="Watch every bet happening across OREOBET in real time. Wins, losses, and multipliers as they happen."
        className="mb-10"
      />

      <div className="flex items-center gap-2 mb-8">
        <TabButton active={tab === 'all'} onClick={() => setTab('all')} icon={<Activity className="w-4 h-4" />}>
          All Bets
        </TabButton>
        <TabButton active={tab === 'highrollers'} onClick={() => setTab('highrollers')} icon={<Flame className="w-4 h-4" />}>
          High Rollers
        </TabButton>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-mono uppercase tracking-wider text-ink-300">
          <div className="col-span-3">Player</div>
          <div className="col-span-2">Game</div>
          <div className="col-span-2 text-right">Bet</div>
          <div className="col-span-2 text-right">Multiplier</div>
          <div className="col-span-3 text-right">Payout</div>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {display.map((bet, i) => (
            <div
              key={bet.id}
              className={cn(
                'grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors hover:bg-white/[0.02]',
                i === 0 && 'animate-slide-up bg-white/[0.03]'
              )}
            >
              <div className="col-span-3 flex items-center gap-2 min-w-0">
                <span className={cn('w-2 h-2 rounded-full shrink-0', bet.result === 'win' ? 'bg-white' : 'bg-ink-400')} />
                <span className="font-mono text-sm text-ink-100 truncate">{bet.user}</span>
              </div>
              <div className="col-span-2 text-sm text-ink-200">{bet.game}</div>
              <div className="col-span-2 text-right font-mono text-sm text-white">{formatUSD(bet.amount)}</div>
              <div className="col-span-2 text-right font-mono text-sm">
                {bet.multiplier > 0 ? (
                  <span className="text-white">{bet.multiplier}x</span>
                ) : (
                  <span className="text-ink-400">—</span>
                )}
              </div>
              <div className="col-span-3 text-right font-mono text-sm">
                {bet.result === 'win' ? (
                  <span className="text-white font-semibold">+{formatUSD(bet.payout)}</span>
                ) : (
                  <span className="text-ink-400">{formatUSD(0)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <Badge>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Live updating every 1.5s
        </Badge>
        <div className="flex items-center gap-2 text-ink-300 text-sm">
          <Trophy className="w-4 h-4" />
          <span>Showing {display.length} bets</span>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
        active ? 'glass text-white' : 'text-ink-200 hover:text-white'
      )}
    >
      {icon}
      {children}
    </button>
  );
}
