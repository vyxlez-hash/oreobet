import { useState, useEffect } from 'react';
import { generateLiveBets } from '../data';
import type { BetRecord } from '../types';
import { cn, formatUSD } from '../utils';

export function LiveTicker() {
  const [bets, setBets] = useState<BetRecord[]>(() => generateLiveBets(20));

  useEffect(() => {
    const interval = setInterval(() => {
      setBets((prev) => [generateLiveBets(1)[0], ...prev.slice(0, 19)]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const doubled = [...bets, ...bets];

  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-ink-900/50 py-3">
      <div className="flex gap-6 animate-marquee whitespace-nowrap">
        {doubled.map((bet, i) => (
          <div key={bet.id + i} className="flex items-center gap-3 text-sm font-mono shrink-0">
            <span className={cn('w-2 h-2 rounded-full', bet.result === 'win' ? 'bg-white' : 'bg-ink-400')} />
            <span className="text-ink-200">{bet.user}</span>
            <span className="text-ink-300">bet</span>
            <span className="text-white">{formatUSD(bet.amount)}</span>
            <span className="text-ink-300">on</span>
            <span className="text-ink-100">{bet.game}</span>
            {bet.result === 'win' ? (
              <>
                <span className="text-ink-300">won</span>
                <span className="text-white font-semibold">+{formatUSD(bet.payout)}</span>
                <span className="text-ink-300">({bet.multiplier}x)</span>
              </>
            ) : (
              <span className="text-ink-400">lost</span>
            )}
          </div>
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-ink-950 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-ink-950 to-transparent" />
    </div>
  );
}
