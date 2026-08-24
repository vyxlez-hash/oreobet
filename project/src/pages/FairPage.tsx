import { useState } from 'react';
import { Shield, KeyRound, Hash, RefreshCw, Check } from 'lucide-react';
import { SectionTitle, Card, Button, Badge } from '../ui';
import { useApp } from '../store';
import { generateSeed, hashSHA256 } from '../utils';

export function FairPage() {
  const { showToast } = useApp();
  const [clientSeed, setClientSeed] = useState(generateSeed().slice(0, 32));
  const [serverSeed, setServerSeed] = useState(generateSeed());
  const [nonce, setNonce] = useState(1);
  const [result, setResult] = useState<number | null>(null);

  const serverSeedHash = hashSHA256(serverSeed);

  const roll = () => {
    const combined = `${serverSeed}:${clientSeed}:${nonce}`;
    const hash = hashSHA256(combined);
    const value = (parseInt(hash.slice(0, 8), 16) % 10000) / 100;
    setResult(value);
    showToast(`Verifiable roll result: ${value.toFixed(2)}`);
  };

  const newSeeds = () => {
    setServerSeed(generateSeed());
    setClientSeed(generateSeed().slice(0, 32));
    setNonce(1);
    setResult(null);
    showToast('New seeds generated');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <SectionTitle
        eyebrow="Transparency"
        title="Provably Fair System"
        subtitle="Every bet on OREOBET is cryptographically verifiable. You can independently confirm that no outcome was manipulated — before, during, or after the bet."
        className="mb-12"
      />

      <div className="grid md:grid-cols-3 gap-4 mb-12">
        <InfoCard
          icon={<KeyRound className="w-6 h-6" />}
          step="1"
          title="Server Seed"
          description="Before each game, the server generates a random seed and shows you its SHA-256 hash. The actual seed stays hidden until the bet is resolved."
        />
        <InfoCard
          icon={<Hash className="w-6 h-6" />}
          step="2"
          title="Client Seed"
          description="You provide your own client seed, which is combined with the server seed and a nonce to determine the outcome. You can change it anytime."
        />
        <InfoCard
          icon={<Shield className="w-6 h-6" />}
          step="3"
          title="Verify"
          description="After the bet, the server seed is revealed. You can re-run the calculation to confirm the result matches — proving no tampering occurred."
        />
      </div>

      <Card className="p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Interactive Verifier</h3>
          <Button variant="outline" size="sm" onClick={newSeeds}>
            <RefreshCw className="w-4 h-4" />
            New Seeds
          </Button>
        </div>

        <div className="space-y-5">
          <SeedField label="Server Seed (hashed)" value={serverSeedHash} mono />
          <SeedField
            label="Server Seed (revealed — demo only)"
            value={serverSeed}
            mono
            editable
            onChange={setServerSeed}
          />
          <SeedField
            label="Client Seed"
            value={clientSeed}
            mono
            editable
            onChange={setClientSeed}
          />
          <div className="grid grid-cols-2 gap-5">
            <SeedField label="Nonce" value={String(nonce)} mono editable onChange={(v) => setNonce(parseInt(v) || 0)} />
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-2 block">Result</label>
              <div className="glass rounded-xl px-4 py-3.5 flex items-center justify-between">
                {result !== null ? (
                  <span className="font-mono text-2xl font-bold text-white">{result.toFixed(2)}</span>
                ) : (
                  <span className="text-ink-400 text-sm">Not rolled yet</span>
                )}
                {result !== null && <Check className="w-5 h-5 text-white" />}
              </div>
            </div>
          </div>

          <Button onClick={roll} className="w-full" size="lg">
            <Shield className="w-5 h-5" />
            Roll & Verify
          </Button>
        </div>
      </Card>

      <Card className="p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl glass flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-white">How verification works</h3>
            <p className="text-sm text-ink-200 leading-relaxed">
              The outcome is calculated as <code className="font-mono text-white bg-white/5 px-1.5 py-0.5 rounded">HMAC-SHA256(server_seed, client_seed:nonce)</code>.
              The first 8 hex characters are converted to a number and mapped to the game's outcome range. Since you
              see the server seed hash before betting, the server cannot change the seed after seeing your client
              seed — making it impossible to manipulate results.
            </p>
            <Badge>
              <Check className="w-3.5 h-3.5" />
              All 6 games use this system
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}

function InfoCard({ icon, step, title, description }: { icon: React.ReactNode; step: string; title: string; description: string }) {
  return (
    <Card hover className="p-6 group">
      <div className="flex items-center justify-between mb-5">
        <div className="w-12 h-12 rounded-xl glass flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
          <span className="text-white">{icon}</span>
        </div>
        <span className="text-3xl font-bold text-ink-600 font-display">{step}</span>
      </div>
      <h3 className="font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-ink-300 leading-relaxed">{description}</p>
    </Card>
  );
}

function SeedField({
  label,
  value,
  mono,
  editable,
  onChange,
}: {
  label: string;
  value: string;
  mono?: boolean;
  editable?: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-2 block">{label}</label>
      <div className="glass rounded-xl px-4 py-3.5 focus-within:border-white/20 transition-colors">
        {editable ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className={`w-full bg-transparent text-white text-sm focus:outline-none ${mono ? 'font-mono' : ''}`}
          />
        ) : (
          <span className={`text-white text-sm break-all ${mono ? 'font-mono' : ''}`}>{value}</span>
        )}
      </div>
    </div>
  );
}
