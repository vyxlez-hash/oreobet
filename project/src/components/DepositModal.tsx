import { useEffect, useMemo, useState } from 'react';
import { Check, Clipboard, Loader2, X } from 'lucide-react';
import { useApp } from '../store';
import { supabase } from '../lib/supabase';
import { Button } from '../ui';
import { cryptoCurrencies } from '../data';
import type { CryptoAddress, CryptoCurrency } from '../types';

export function DepositModal() {
  const { activeModal, closeModal, user, showToast } = useApp();
  const [selected, setSelected] = useState<CryptoCurrency>('BTC');
  const [amount, setAmount] = useState('1');
  const [hash, setHash] = useState('');
  const [addresses, setAddresses] = useState<CryptoAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeModal !== 'deposit' || !user) return;
    setCreated(false); setError(''); setHash(''); setAmount('1');
    supabase.rpc('get_crypto_addresses').then(({ data }) => setAddresses((data || []) as CryptoAddress[]));
  }, [activeModal, user]);

  const address = useMemo(() => addresses.find(a => a.currency === selected)?.address || '', [addresses, selected]);
  if (activeModal !== 'deposit' || !user) return null;

  const submit = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 1) { setError('Minimum deposit is $1.'); return; }
    if (!address) { setError('This cryptocurrency deposit address has not been configured by the admin yet.'); return; }
    setLoading(true); setError('');
    const { error: e } = await supabase.rpc('create_deposit_request', { p_currency: selected, p_amount: value, p_tx_hash: hash || null });
    setLoading(false);
    if (e) { setError(e.message); return; }
    setCreated(true); showToast('Deposit request created.');
  };

  const copy = async () => { if (address) { await navigator.clipboard.writeText(address).catch(() => {}); showToast('Deposit address copied.'); } };
  const currency = cryptoCurrencies.find(c => c.code === selected)!;

  return <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div className="glass-strong w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10">
      <div className="flex items-center justify-between mb-7"><div><div className="text-xs font-mono uppercase tracking-wider text-ink-400">Wallet</div><h2 className="text-2xl font-bold text-white">Deposit via crypto</h2></div><button onClick={closeModal} className="text-ink-300 hover:text-white"><X /></button></div>
      {created ? <div className="py-10 text-center"><div className="w-16 h-16 rounded-full bg-white text-black mx-auto flex items-center justify-center mb-5"><Check className="w-8 h-8" /></div><h3 className="text-xl font-bold text-white mb-2">Deposit request has been created</h3><p className="text-sm text-ink-300 max-w-sm mx-auto">An admin will verify the transaction and credit your balance. Your balance will not change until the request is approved.</p><Button className="mt-7" onClick={closeModal}>Done</Button></div> : <>
        <div className="grid grid-cols-4 gap-2 mb-6">{cryptoCurrencies.map(c => <button key={c.code} onClick={() => setSelected(c.code)} className={`rounded-xl p-3 border text-center transition ${selected===c.code?'bg-white text-black border-white':'glass text-ink-200 border-white/10 hover:bg-white/10'}`}><div className="text-lg">{c.icon}</div><div className="text-xs font-mono mt-1">{c.code}</div></button>)}</div>
        <div className="space-y-5">
          <label className="block"><span className="text-xs text-ink-300 uppercase font-mono">Amount (USD)</span><input value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,''))} inputMode="decimal" className="mt-2 w-full glass rounded-xl px-4 py-3.5 bg-transparent text-white outline-none" placeholder="Minimum $1" /></label>
          <div><div className="text-xs text-ink-300 uppercase font-mono mb-2">Send {currency.name} to this address</div><div className="glass rounded-xl p-4 flex gap-3 items-center"><code className="text-xs text-white break-all flex-1">{address || 'Not configured'}</code><button onClick={copy} className="shrink-0 text-ink-300 hover:text-white"><Clipboard className="w-4 h-4" /></button></div></div>
          <label className="block"><span className="text-xs text-ink-300 uppercase font-mono">Transaction hash / ID <span className="normal-case text-ink-500">(optional)</span></span><input value={hash} onChange={e=>setHash(e.target.value)} className="mt-2 w-full glass rounded-xl px-4 py-3.5 bg-transparent text-white outline-none font-mono text-xs" placeholder="Paste tx hash if you have it" /></label>
          {error && <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-ink-200">{error}</div>}
          <Button className="w-full" size="lg" onClick={submit} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Check />} {loading ? 'CREATING REQUEST...' : 'I SENT THE CRYPTO'}</Button>
          <p className="text-[11px] text-ink-500 text-center">Minimum deposit: $1 · Manual verification required</p>
        </div>
      </>}
    </div>
  </div>;
}
