import { Shield, Coins, FileText, Lock, MapPin, AlertTriangle } from 'lucide-react';
import { Logo, LogoMark } from './Logo';
import { useApp } from '../store';
import type { PageId } from '../types';

export function Footer() {
  const { navigate } = useApp();

  const link = (label: string, page: PageId) => (
    <button onClick={() => navigate(page)} className="text-ink-200 hover:text-white transition-colors text-sm">
      {label}
    </button>
  );

  return (
    <footer className="relative border-t border-white/5 bg-ink-950 noise-overlay">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <LogoMark className="w-8 h-8" />
              <Logo />
            </div>
            <p className="text-sm text-ink-300 max-w-xs mb-6">
              A next-generation crypto gaming experience. Play. Win. Withdraw. Provably fair. Always.
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-200 glass px-3 py-1.5 rounded-full">
                <Shield className="w-3.5 h-3.5" />
                PROVABLY FAIR
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-200 glass px-3 py-1.5 rounded-full">
                <Lock className="w-3.5 h-3.5" />
                SSL SECURED
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-4">Games</h4>
            {link('Dice', 'play-dice')}
            {link('Crash', 'play-crash')}
            {link('Roulette', 'play-roulette')}
            {link('Blackjack', 'play-blackjack')}
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-4">Platform</h4>
            {link('All Games', 'games')}
            {link('Live Bets', 'live')}
            {link('Promotions', 'promotions')}
            {link('Provably Fair', 'fair')}
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-4">Support</h4>
            {link('Help Center', 'support')}
            {link('Dashboard', 'dashboard')}
            <button className="text-ink-200 hover:text-white transition-colors text-sm">Terms of Service</button>
            <button className="text-ink-200 hover:text-white transition-colors text-sm">Privacy Policy</button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-4">Compliance</h4>
            <div className="space-y-2 text-sm text-ink-200">
              <div className="flex items-center gap-2"><Coins className="w-4 h-4 text-ink-300" /> KYC / AML</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-ink-300" /> Restricted Regions</div>
              <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-ink-300" /> Responsible Gaming</div>
              <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-ink-300" /> Licensing Info</div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 space-y-6">
          <div className="glass rounded-2xl p-6 border-l-2 border-l-white/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl glass flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-white">18+ Only — Play Responsibly</h3>
                <p className="text-sm text-ink-200 leading-relaxed">
                  Gambling can be addictive. OREOBET is strictly 18+. Please gamble responsibly and only with
                  funds you can afford to lose. If gambling is affecting your life, contact BeGambleAware at
                  begambleaware.org or GamCare at gamcare.org.uk for free, confidential 24/7 support.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-ink-300">
            <div>© 2026 OREOBET. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <button className="hover:text-white transition-colors">Terms</button>
              <button className="hover:text-white transition-colors">Privacy</button>
              <button className="hover:text-white transition-colors">Cookies</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
