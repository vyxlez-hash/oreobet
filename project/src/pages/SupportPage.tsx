import { useState } from 'react';
import { MessageCircle, Mail, Clock, Search, ChevronDown } from 'lucide-react';
import { SectionTitle, Card, Button, Badge } from '../ui';
import { useApp } from '../store';
import { cn } from '../utils';

const faqs = [
  {
    q: 'Is OREOBET a real gambling platform?',
    a: 'OREOBET is a crypto gaming platform. You can deposit using Litecoin, Solana, or Ethereum, and your balance is tracked in USD. All games use a provably fair system so you can independently verify every outcome.',
  },
  {
    q: 'How does the provably fair system work?',
    a: 'Each bet uses a combination of a server seed (revealed after the bet), your client seed, and a nonce. The outcome is derived from HMAC-SHA256 of these values. You can verify any bet outcome independently using the verifier on the Provably Fair page.',
  },
  {
    q: 'What cryptocurrencies are supported?',
    a: 'OREOBET currently supports Litecoin (LTC), Solana (SOL), and Ethereum (ETH) for deposits and withdrawals. Your balance is displayed in USD for consistency across games.',
  },
  {
    q: 'How do I get started?',
    a: 'Create a free account by clicking Sign Up. Once logged in, head to your dashboard and click Deposit to fund your account with LTC, SOL, or ETH. Your balance is tracked in USD.',
  },
  {
    q: 'Is there an age requirement?',
    a: 'Yes. OREOBET is strictly 18+. Even though this is a demo, we enforce age-appropriate design. A production platform would require full KYC/AML verification.',
  },
  {
    q: 'What are the restricted jurisdictions?',
    a: 'In a production environment, OREOBET would restrict access from jurisdictions where online gambling is prohibited, including but not limited to the United States, United Kingdom, France, Netherlands, Australia, and others. IP-based geofencing and KYC verification would be enforced.',
  },
  {
    q: 'How do I set responsible gaming limits?',
    a: 'From your dashboard settings, you can set deposit limits, loss limits, and session time limits. You can also self-exclude or activate a cool-down period. These features are simulated in this demo.',
  },
  {
    q: 'Who can I contact for help?',
    a: 'Use the live chat or email form on this page. In a production environment, support would be available 24/7 with trained specialists including responsible gaming counselors.',
  },
];

export function SupportPage() {
  const { showToast } = useApp();
  const [open, setOpen] = useState<number | null>(0);
  const [search, setSearch] = useState('');

  const filtered = faqs.filter(
    (f) => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <SectionTitle
        eyebrow="Help Center"
        title="Support"
        subtitle="Get help with your account, games, fairness verification, or responsible gaming. We're here 24/7."
        className="mb-12"
      />

      <div className="grid md:grid-cols-3 gap-4 mb-12">
        <ContactCard
          icon={<MessageCircle className="w-6 h-6" />}
          title="Live Chat"
          description="Average response in 2 minutes"
          action="Start Chat"
          onClick={() => showToast('Live chat is simulated in this demo')}
        />
        <ContactCard
          icon={<Mail className="w-6 h-6" />}
          title="Email Support"
          description="support@oreobet.demo"
          action="Send Email"
          onClick={() => showToast('Email support is simulated in this demo')}
        />
        <ContactCard
          icon={<Clock className="w-6 h-6" />}
          title="Response Time"
          description="24/7 availability, 24h max"
          action="View Status"
          onClick={() => showToast('All systems operational')}
        />
      </div>

      <Card className="p-6 mb-8">
        <div className="flex items-center gap-3 glass rounded-xl px-4 py-3.5">
          <Search className="w-5 h-5 text-ink-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search frequently asked questions..."
            className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-ink-400"
          />
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.map((faq, i) => (
          <Card key={i} className="overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-5 text-left"
            >
              <span className="text-sm md:text-base font-medium text-white pr-4">{faq.q}</span>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-ink-300 transition-transform duration-300 shrink-0',
                  open === i && 'rotate-180'
                )}
              />
            </button>
            {open === i && (
              <div className="px-6 pb-5 animate-slide-up">
                <p className="text-sm text-ink-200 leading-relaxed">{faq.a}</p>
              </div>
            )}
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-ink-300 text-sm">
            No results found for "{search}"
          </Card>
        )}
      </div>

      <Card className="mt-8 p-8 border-l-2 border-l-white/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl glass flex items-center justify-center shrink-0">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-white">Responsible Gaming Support</h3>
            <p className="text-sm text-ink-200 leading-relaxed">
              If gambling is affecting your life or someone you know, help is available. Contact
              BeGambleAware at begambleaware.org or GamCare at gamcare.org.uk. These organizations
              provide free, confidential support 24/7.
            </p>
            <Badge>
              <Clock className="w-3.5 h-3.5" />
              Confidential & Free
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ContactCard({
  icon,
  title,
  description,
  action,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <Card hover className="p-6 group">
      <div className="w-12 h-12 rounded-xl glass flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110">
        <span className="text-white">{icon}</span>
      </div>
      <h3 className="font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-ink-300 mb-4">{description}</p>
      <Button variant="secondary" size="sm" onClick={onClick} className="w-full">
        {action}
      </Button>
    </Card>
  );
}
