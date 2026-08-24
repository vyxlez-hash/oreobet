import { Gift, Copy, Check, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { SectionTitle, Card, Button, Badge } from '../ui';
import { promotions } from '../data';
import { useApp } from '../store';
import { cn } from '../utils';

export function PromotionsPage() {
  const { showToast } = useApp();
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    showToast(`Code "${code}" copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <SectionTitle
        eyebrow="Rewards"
        title="Promotions & Bonuses"
        subtitle="Boost your demo balance with these promotional offers. All rewards are simulated for demonstration."
        className="mb-12"
      />

      <div className="grid md:grid-cols-2 gap-6">
        {promotions.map((promo, i) => (
          <Card
            key={promo.id}
            hover
            className={cn('p-8 group relative overflow-hidden animate-fade-in-up')}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              style={{ background: 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.04), transparent 60%)' }}
            />
            <div className="relative z-10" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center">
                  <Gift className="w-7 h-7 text-white" />
                </div>
                <Badge className={cn(promo.active ? 'border-white/20 text-white' : 'text-ink-300')}>
                  {promo.badge}
                </Badge>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">{promo.title}</h3>
              <p className="text-sm text-ink-200 leading-relaxed mb-6">{promo.description}</p>

              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-1">Reward</div>
                  <div className="text-lg font-bold text-white font-display">{promo.reward}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 glass rounded-xl px-4 py-3 font-mono text-sm text-white tracking-wider">
                  {promo.code}
                </div>
                <Button
                  variant={copied === promo.code ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => copyCode(promo.code)}
                  disabled={!promo.active}
                >
                  {copied === promo.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied === promo.code ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center shrink-0">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-bold text-white mb-2">More promotions coming soon</h3>
          <p className="text-sm text-ink-200">
            We're constantly adding new rewards, tournaments, and seasonal events. Stay tuned for exclusive VIP offers.
          </p>
        </div>
      </Card>
    </div>
  );
}
