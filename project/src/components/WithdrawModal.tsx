import { useState } from 'react';
import { X, ArrowUpFromLine, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '../store';
import { supabase } from '../lib/supabase';
import { Button } from '../ui';
import { cryptoCurrencies } from '../data';
import { cn, formatUSD } from '../utils';
import type { CryptoCurrency } from '../types';

const MIN_WITHDRAW = 1;

export function WithdrawModal() {
  const { activeModal, closeModal, user, showToast, refreshBalance } = useApp();
  const [selectedCoin, setSelectedCoin] = useState<CryptoCurrency>('LTC');
  const [usdAmount, setUsdAmount] = useState(MIN_WITHDRAW);
  const [walletAddress, setWalletAddress] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (activeModal !== 'withdraw') return null;

  const maxWithdraw = user?.balance || 0;

  const confirmWithdraw = async () => {
    if (!user) return;
    setError(null);

    if (usdAmount < MIN_WITHDRAW) {
      setError(`Minimum withdrawal is ${formatUSD(MIN_WITHDRAW)}`);
      return;
    }
    if (usdAmount > maxWithdraw) {
      setError(`Insufficient balance. Available: ${formatUSD(maxWithdraw)}`);
      return;
    }
    if (!walletAddress.trim()) {
      setError('Please enter your wallet address');
      return;
    }
    if (walletAddress.trim().length < 10) {
      setError('Please enter a valid wallet address');
      return;
    }

    setProcessing(true);

    const { error: txErr } = await supabase.from('transactions').insert({
      type: 'withdraw',
      amount: usdAmount,
      currency: selectedCoin,
      status: 'completed',
      tx_hash: walletAddress.trim(),
    });

    if (txErr) {
      setError(txErr.message);
      setProcessing(false);
      return;
    }

    const newBalance = user.balance - usdAmount;
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
    setWalletAddress('');
    closeModal();
    showToast(`${formatUSD(usdAmount)} withdrawal processed`);
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
            <ArrowUpFromLine className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Withdraw</h2>
            <p className="text-sm text-ink-300">Available: {formatUSD(maxWithdraw)}</p>
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
              min={MIN_WITHDRAW}
              max={maxWithdraw}
              step="0.01"
              value={usdAmount}
              onChange={(e) => setUsdAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent text-white text-sm focus:outline-none font-mono"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setUsdAmount(parseFloat((maxWithdraw * 0.25).toFixed(2)))}
              className="flex-1 glass rounded-lg py-1.5 text-xs text-ink-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              25%
            </button>
            <button
              onClick={() => setUsdAmount(parseFloat((maxWithdraw * 0.5).toFixed(2)))}
              className="flex-1 glass rounded-lg py-1.5 text-xs text-ink-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              50%
            </button>
            <button
              onClick={() => setUsdAmount(parseFloat(maxWithdraw.toFixed(2)))}
              className="flex-1 glass rounded-lg py-1.5 text-xs text-ink-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              MAX
            </button>
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

        <label className="block mb-6">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-2 block">
            Your {cryptoCurrencies.find((c) => c.code === selectedCoin)?.name || selectedCoin} wallet address
          </span>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-ink-400 glass rounded-xl px-4 py-3.5 focus-within:border-white/20 transition-colors font-mono"
            placeholder="Enter your wallet address"
          />
        </label>

        <Button onClick={confirmWithdraw} className="w-full" size="lg" disabled={processing || maxWithdraw < MIN_WITHDRAW}>
          {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpFromLine className="w-5 h-5" />}
          {processing ? 'PROCESSING...' : `WITHDRAW ${formatUSD(usdAmount)}`}
        </Button>

        {maxWithdraw < MIN_WITHDRAW && (
          <p className="text-xs text-ink-400 text-center mt-3">
            Minimum withdrawal is {formatUSD(MIN_WITHDRAW)}
          </p>
        )}
      </div>
    </div>
  );
}
