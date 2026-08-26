import { useState } from 'react';
import { ArrowUpFromLine, Check, Loader2, X } from 'lucide-react';
import { useApp } from '../store';
import { supabase } from '../lib/supabase';
import { Button } from '../ui';
import { cryptoCurrencies } from '../data';
import type { CryptoCurrency } from '../types';

export function WithdrawModal() {
  const { activeModal, closeModal, user, showToast } = useApp();
  const [selected, setSelected] = useState<CryptoCurrency>('BTC');
  const [amount, setAmount] = useState('1');
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState('');
  if (activeModal !== 'withdraw' || !user) return null;

  const submit = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 1) { setError('Minimum withdrawal is $1.'); return; }
    if (value > user.balance) { setError('Insufficient balance.'); return; }
    if (wallet.trim().length < 8) { setError('Enter your destination wallet address.'); return; }
    setLoading(true); setError('');
    const { error: e } = await supabase.rpc('create_withdraw_request', { p_currency: selected, p_amount: value, p_wallet: wallet.trim() });
    setLoading(false);
    if (e) { setError(e.message); return; }
    setCreated(true); showToast('Withdrawal request created.');
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"><div className="glass-strong w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10">
    <div className="flex items-center justify-between mb-7"><div><div className="text-xs font-mono uppercase tracking-wider text-ink-400">Wallet</div><h2 className="text-2xl font-bold text-white">Withdraw crypto</h2></div><button onClick={closeModal} className="text-ink-300 hover:text-white"><X /></button></div>
    {created ? <div className="py-10 text-center"><div className="w-16 h-16 rounded-full bg-white text-black mx-auto flex items-center justify-center mb-5"><Check className="w-8 h-8" /></div><h3 className="text-xl font-bold text-white mb-2">Withdrawal request has been created</h3><p className="text-sm text-ink-300 max-w-sm mx-auto">{formatUsd(Number(amount))} has been reserved from your balance. An admin will review and process it.</p><Button className="mt-7" onClick={closeModal}>Done</Button></div> : <>
      <div className="grid grid-cols-4 gap-2 mb-6">{cryptoCurrencies.map(c=><button key={c.code} onClick={()=>setSelected(c.code)} className={`rounded-xl p-3 border text-center transition ${selected===c.code?'bg-white text-black border-white':'glass text-ink-200 border-white/10 hover:bg-white/10'}`}><div className="text-lg">{c.icon}</div><div className="text-xs font-mono mt-1">{c.code}</div></button>)}</div>
      <div className="space-y-5"><label className="block"><span className="text-xs text-ink-300 uppercase font-mono">Amount (USD)</span><input value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,''))} className="mt-2 w-full glass rounded-xl px-4 py-3.5 bg-transparent text-white outline-none" placeholder="Minimum $1" /></label>
      <label className="block"><span className="text-xs text-ink-300 uppercase font-mono">Your {selected} wallet address</span><input value={wallet} onChange={e=>setWallet(e.target.value)} className="mt-2 w-full glass rounded-xl px-4 py-3.5 bg-transparent text-white outline-none font-mono text-xs" placeholder="Paste your wallet address" /></label>
      {error && <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-ink-200">{error}</div>}
      <Button className="w-full" size="lg" onClick={submit} disabled={loading}>{loading?<Loader2 className="animate-spin"/>:<ArrowUpFromLine/>}{loading?'CREATING REQUEST...':'REQUEST WITHDRAWAL'}</Button><p className="text-[11px] text-ink-500 text-center">Minimum withdrawal: $1 · Manual admin processing</p></div>
    </>}
  </div></div>;
}
function formatUsd(n:number){return `$${n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}
