import { useState } from 'react';
import { X, ArrowDownToLine, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '../store';
import { supabase } from '../lib/supabase';
import { Button } from '../ui';
import { cryptoCurrencies } from '../data';
import { cn, formatUSD } from '../utils';
import type { CryptoCurrency } from '../types';

const MIN_DEPOSIT = 1;

export function DepositModal() {
  const { activeModal, closeModal, user, showToast, refreshBalance } = useApp();
  const [selectedCoin, setSelectedCoin] = useState<CryptoCurrency>('LTC');
  const [usdAmount, setUsdAmount] = useState(MIN_DEPOSIT);
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (activeModal !== 'deposit') return null;

  const coin = cryptoCurrencies.find((c) => c.code === selectedCoin)!;

  const copyAddress = () => {
    navigator.clipboard.writeText(coin.address).catch(() => {});
    setCopied(true);
    showToast('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmDeposit = async () => {
    if (!user) return;
    setError(null);

    if (usdAmount < MIN_DEPOSIT) {
      setError(`Minimum deposit is ${formatUSD(MIN_DEPOSIT)}`);
      return;
    }

    setProcessing(true);

    const { error: txErr } = await supabase.from('transactions').insert({
      type: 'deposit',
      amount: usdAmount,
      currency: selectedCoin,
      status: 'completed',
      tx_hash: null,
    });

    if (txErr) {
      setError(txErr.message);
      setProcessing(false);
      return;
    }

    const newBalance = user.balance + usdAmount;
    const { error: balErr } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', user.id);

    if (balErr) {
      setError(balErr.message);
      setProcessing(false);
      return;
    }

    await refreshBalance();
    setProcessing(false);
    closeModal();
    showToast(`${formatUSD(usdAmount)} deposited successfully`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
      <div className="relative glass-strong rounded-3xl w-full max-w-md p-8 animate-scale-in noise-overlay">
        <button onClick={closeModal} className="absolute top-4 right-4 text-ink-300 hover:text-white transition-colors p-2">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center">
            <ArrowDownToLine className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Deposit</h2>
            <p className="text-sm text-ink-300">Minimum {formatUSD(MIN_DEPOSIT)}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 glass rounded-xl px-4 py-3 text-sm text-white border border-white/10">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <label className="block mb-5">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-2 block">Amount (USD)</span>
          <div className="flex items-center gap-3 glass rounded-xl px-4 py-3.5 focus-within:border-white/20 transition-colors">
            <span className="text-ink-300 text-sm">$</span>
            <input
              type="number"
              min={MIN_DEPOSIT}
              step="0.01"
              value={usdAmount}
              onChange={(e) => setUsdAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent text-white text-sm focus:outline-none font-mono"
            />
          </div>
        </label>

        <div className="mb-5">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-2 block">Currency</span>
          <div className="grid grid-cols-3 gap-2">
            {cryptoCurrencies.map((c) => (
              <button
                key={c.code}
                onClick={() => setSelectedCoin(c.code)}
                className={cn(
                  'py-3 rounded-xl text-sm font-medium transition-all duration-300 flex flex-col items-center gap-1',
                  selectedCoin === c.code ? 'bg-white text-black' : 'glass text-ink-200 hover:bg-white/10'
                )}
              >
                <span className="text-lg">{c.icon}</span>
                {c.code}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-2 block">
            Send {coin.name} to this address
          </span>
          <div className="glass rounded-xl px-4 py-3.5 flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-ink-100 break-all">{coin.address}</span>
            <button onClick={copyAddress} className="text-ink-300 hover:text-white transition-colors shrink-0">
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button onClick={confirmDeposit} className="w-full" size="lg" disabled={processing}>
          {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowDownToLine className="w-5 h-5" />}
          {processing ? 'PROCESSING...' : `DEPOSIT ${formatUSD(usdAmount)}`}
        </Button>
      </div>
    </div>
  );
}
