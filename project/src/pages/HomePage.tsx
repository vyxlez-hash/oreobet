import { ArrowRight, Sparkles, Shield, Zap, Globe } from 'lucide-react';
import { Hero } from '../components/Hero';
import { LiveTicker } from '../components/LiveTicker';
import { GameGrid } from '../components/GameGrid';
import { SectionTitle, Button, Card } from '../ui';
import { useApp } from '../store';

export function HomePage() {
  const { navigate, openAuth } = useApp();

  return (
    <div>
      <Hero />
      <LiveTicker />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex items-end justify-between mb-12">
          <SectionTitle
            eyebrow="Featured Games"
            title="Choose your game"
            subtitle="Six provably fair games. Zero house tricks. Every result verifiable on-chain."
          />
          <Button variant="outline" onClick={() => navigate('games')} className="hidden md:inline-flex group">
            View All
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
        <GameGrid limit={3} />
        <div className="mt-8 md:hidden">
          <Button variant="outline" onClick={() => navigate('games')} className="w-full">
            View All Games
          </Button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-3 gap-6">
          <Feature
            icon={<Zap className="w-6 h-6" />}
            title="Instant Payouts"
            description="Win and withdraw in seconds. No waiting, no delays. Your crypto, your control."
          />
          <Feature
            icon={<Shield className="w-6 h-6" />}
            title="Provably Fair"
            description="Every bet is cryptographically verifiable. Check the fairness of every roll, spin, and draw yourself."
          />
          <Feature
            icon={<Globe className="w-6 h-6" />}
            title="Global & Anonymous"
            description="Play from anywhere with just a wallet. No lengthy verification for demo play."
          />
        </div>
      </section>

      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-xs font-mono uppercase tracking-wider text-ink-100">Get Started</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight text-balance mb-6">
            Ready to play?
          </h2>
          <p className="text-lg text-ink-200 mb-10 max-w-xl mx-auto">
            Create your free account and deposit with Litecoin, Solana, or Ethereum to start playing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => openAuth('signup')} className="group">
              CREATE FREE ACCOUNT
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('fair')}>
              Learn About Fairness
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card hover className="p-8 group">
      <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
        <span className="text-white">{icon}</span>
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-sm text-ink-200 leading-relaxed">{description}</p>
    </Card>
  );
}
