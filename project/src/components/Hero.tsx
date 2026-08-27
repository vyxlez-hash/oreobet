import { ArrowUpRight, Shield, TrendingUp, Users } from 'lucide-react';
import { useApp } from '../store';
import { Button } from '../ui';
import { AnimatedBackground } from './AnimatedBackground';
import { games } from '../data';
import { formatNumber } from '../utils';

export function Hero() {
  const { navigate, openAuth, user } = useApp();

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden noise-overlay">
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-ink-100">
              {formatNumber(games.reduce((sum, g) => sum + g.players, 0))} players online
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white leading-[0.9] animate-fade-in-up">
            PLAY.
            <br />
            WIN.
            <br />
            <span className="gradient-text">WITHDRAW.</span>
          </h1>

          <p className="mt-8 text-lg md:text-xl text-ink-200 max-w-xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            A next-generation crypto gaming experience. Built for speed, fairness, and the thrill of the win.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Button size="lg" onClick={() => (user ? navigate('games') : openAuth('signup'))} className="group">
              PLAY NOW
              <ArrowUpRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('games')}>
              EXPLORE GAMES
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Stat icon={<TrendingUp className="w-5 h-5" />} label="Total Wagered" value="$42.8M" />
            <Stat icon={<Users className="w-5 h-5" />} label="Active Players" value="8.7K" />
            <Stat icon={<Shield className="w-5 h-5" />} label="Provably Fair" value="100%" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-ink-950 to-transparent z-[5]" />
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-2">
      <div className="text-ink-200">{icon}</div>
      <div className="text-xl sm:text-2xl font-bold text-white font-display">{value}</div>
      <div className="text-xs text-ink-300 uppercase tracking-wider">{label}</div>
    </div>
  );
}
