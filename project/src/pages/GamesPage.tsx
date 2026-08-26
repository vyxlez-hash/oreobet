import { GameGrid } from '../components/GameGrid';
import { SectionTitle } from '../ui';
import { formatUSD } from '../utils';

export function GamesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <SectionTitle
        eyebrow="All Games"
        title="The OREOBET Collection"
        subtitle="Six provably fair games with verifiable outcomes. Every roll, spin, and shuffle is cryptographically transparent."
        className="mb-12"
      />
      <GameGrid />

      <div className="mt-16 grid sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-white font-display mb-1">1.0%</div>
          <div className="text-xs text-ink-300 uppercase tracking-wider">Lowest House Edge</div>
        </div>
        <div className="glass rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-white font-display mb-1">{formatUSD(10000)}</div>
          <div className="text-xs text-ink-300 uppercase tracking-wider">Max Bet</div>
        </div>
        <div className="glass rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-white font-display mb-1">100%</div>
          <div className="text-xs text-ink-300 uppercase tracking-wider">Provably Fair</div>
        </div>
      </div>
    </div>
  );
}
