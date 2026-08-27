import { useState, useEffect, useCallback } from 'react';
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, TrendingUp, TrendingDown,
  Settings, Shield, User as UserIcon, Check, Copy, LogOut,
} from 'lucide-react';
import { useApp } from '../store';
import { supabase } from '../lib/supabase';
import { Card, Button, Badge } from '../ui';
import { cn, formatUSD, shortHash, formatDateTime } from '../utils';
import { GeneratedAvatar } from '../components/GeneratedAvatar';
import type { TransactionRow, BetRow } from '../types';

type Tab = 'overview' | 'history' | 'settings';

function AdminBalancePanel() {
  const { user, showToast } = useApp();
  const [target, setTarget] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user?.isAdmin) return null;

  const adjust = async (sign: 1 | -1) => {
    const value = Number(amount);
    if (!target.trim()) return showToast('Enter a username.');
    if (!Number.isFinite(value) || value <= 0) return showToast('Enter a valid amount.');
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_adjust_balance', {
      target_username: target.trim(),
      amount_delta: value * sign,
    });
    setLoading(false);
    if (error) return showToast(error.message);
    showToast(`@${data.username} balance is now ${formatUSD(Number(data.balance))}`);
    setTarget('');
    setAmount('');
  };

  return (
    <Card className="p-6 mb-8 border border-white/10">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-1">Admin</div>
          <h2 className="text-xl font-bold text-white">Balance management</h2>
          <p className="text-sm text-ink-400 mt-1">Add or remove a user's balance securely through Supabase.</p>
        </div>
        <Shield className="w-6 h-6 text-white" />
      </div>
      <div className="grid md:grid-cols-[1fr_180px_auto] gap-3">
        <input value={target} onChange={e => setTarget(e.target.value)} placeholder="Username" className="glass rounded-xl px-4 py-3 bg-transparent text-white outline-none" />
        <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Amount (USD)" inputMode="decimal" className="glass rounded-xl px-4 py-3 bg-transparent text-white outline-none" />
        <div className="flex gap-2">
          <Button disabled={loading} onClick={() => adjust(1)}>+ Add</Button>
          <Button disabled={loading} variant="outline" onClick={() => adjust(-1)}>- Remove</Button>
        </div>
      </div>
      <div className="mt-5 pt-5 border-t border-white/5 flex flex-wrap items-center gap-3">
        <span className="text-xs font-mono uppercase tracking-wider text-ink-400">Role</span>
        <select id="admin-role" defaultValue="member" className="glass rounded-xl px-3 py-2 bg-transparent text-white text-sm">
          <option value="member">Member</option><option value="vip">VIP</option><option value="moderator">Moderator</option><option value="admin">Admin</option>
        </select>
        <Button variant="outline" size="sm" onClick={async () => { const role = (document.getElementById('admin-role') as HTMLSelectElement)?.value || 'member'; if (!target.trim()) return showToast('Enter a username first.'); const { error } = await supabase.rpc('set_user_role', { target_username: target.trim(), new_role: role }); if (error) showToast(error.message); else showToast(`@${target.trim()} is now ${role}.`); }}>Set Role</Button>
        <span className="text-xs text-ink-500">Roles appear next to names in chat.</span>
      </div>
    </Card>
  );
}

function AdminRequestsPanel() {
  const { user, showToast } = useApp();
  const [requests, setRequests] = useState<TransactionRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const adminId = user?.id;
  const isAdmin = Boolean(user?.isAdmin);

  const load = useCallback(async (showLoader = false) => {
    if (!adminId || !isAdmin) return;
    if (showLoader) setLoading(true);

    const [txRes, addrRes] = await Promise.all([
      supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.rpc('get_crypto_addresses'),
    ]);

    if (txRes.data) {
      setRequests(txRes.data as TransactionRow[]);
      const ids = [...new Set(txRes.data.map((x: any) => x.user_id))];
      if (ids.length) {
        const { data: ps } = await supabase.from('profiles').select('id,username').in('id', ids);
        const map: Record<string, string> = {};
        (ps || []).forEach((x: any) => { map[x.id] = x.username; });
        setNames(map);
      }
    }

    if (addrRes.data) {
      const amap: Record<string, string> = {};
      (addrRes.data || []).forEach((x: any) => { amap[x.currency] = x.address; });
      setAddresses(amap);
    }
    if (showLoader) setLoading(false);
  }, [adminId, isAdmin]);

  useEffect(() => {
    load(true);
  }, [load]);

  if (!isAdmin) return null;

  const saveAddress = async (currency: string) => {
    setSaving(true);
    const { error } = await supabase.rpc('admin_update_crypto_address', {
      p_currency: currency,
      p_address: addresses[currency] || '',
    });
    setSaving(false);
    if (error) showToast(error.message);
    else showToast(`${currency} deposit address updated.`);
  };

  const update = async (id: string, status: 'completed' | 'failed') => {
    const note = window.prompt(`Admin note for ${status} (optional):`) || '';
    const { error } = await supabase.rpc('admin_update_transaction', {
      p_id: id,
      p_status: status,
      p_note: note,
    });
    if (error) {
      showToast(error.message);
      return;
    }
    showToast('Request updated.');
    // Refresh the data without replacing the panel with a loading state.
    // This keeps the Approve/Fail controls mounted and clickable.
    await load(false);
  };

  return (
    <div className="space-y-6 mb-10">
      <Card className="p-6 border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-ink-400">Admin only</div>
            <h2 className="text-xl font-bold text-white">Crypto deposit addresses</h2>
            <p className="text-sm text-ink-400 mt-1">Only admins can change the addresses shown to users.</p>
          </div>
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {['BTC', 'SOL', 'LTC', 'ETH'].map(c => (
            <div key={c} className="glass rounded-2xl p-4">
              <div className="text-xs font-mono text-ink-400 mb-2">{c}</div>
              <div className="flex gap-2">
                <input value={addresses[c] || ''} onChange={e => setAddresses(a => ({ ...a, [c]: e.target.value }))} className="min-w-0 flex-1 bg-transparent text-white text-xs font-mono outline-none" placeholder={`${c} deposit address`} />
                <Button size="sm" disabled={saving} onClick={() => saveAddress(c)}>Save</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <div className="text-xs font-mono uppercase tracking-wider text-ink-400">Admin only</div>
          <h2 className="text-xl font-bold text-white mt-1">Deposit / Withdraw requests</h2>
          <p className="text-sm text-ink-400 mt-1">See who requested it, amount, currency, wallet/hash and approve or fail it.</p>
        </div>
        {loading ? (
          <div className="p-10 text-center text-ink-400">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center text-ink-400">No requests.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs font-mono uppercase text-ink-400 border-b border-white/5"><th className="p-4">User</th><th className="p-4">Type</th><th className="p-4">Amount</th><th className="p-4">Coin</th><th className="p-4">Hash / Wallet</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-b border-white/[.03] align-top">
                    <td className="p-4 text-white">@{names[r.user_id] || r.user_id.slice(0, 8)}</td>
                    <td className="p-4 uppercase text-ink-200">{r.type}</td>
                    <td className="p-4 font-mono text-white">{formatUSD(Number(r.amount))}</td>
                    <td className="p-4 text-ink-200">{r.currency}</td>
                    <td className="p-4 max-w-[260px]"><code className="text-[10px] text-ink-300 break-all">{r.type === 'deposit' ? (r.tx_hash || 'No hash supplied') : (r.wallet_address || 'No wallet')}</code></td>
                    <td className="p-4"><span className="text-xs font-mono uppercase text-ink-200">{r.status}</span></td>
                    <td className="p-4">
                      {r.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" disabled={false} onClick={() => update(r.id, 'completed')}>Approve</Button>
                          <Button size="sm" variant="outline" disabled={false} onClick={() => update(r.id, 'failed')}>Fail</Button>
                        </div>
                      )}
                      {r.admin_note && <div className="text-[10px] text-ink-500 mt-2">{r.admin_note}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export function DashboardPage() {
  const { user, logout, openModal, showToast, navigate, refreshProfile } = useApp();
  const [tab, setTab] = useState<Tab>('overview');
  const [bets, setBets] = useState<BetRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [betsRes, txRes] = await Promise.all([
      supabase.from('bets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]);
    if (betsRes.data) setBets(betsRes.data as BetRow[]);
    if (txRes.data) setTransactions(txRes.data as TransactionRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
    refreshProfile();
  }, [loadData, refreshProfile]);

  if (!user) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center"><p className="text-ink-200 mb-4">Please sign in to view your dashboard.</p><Button onClick={() => navigate('home')}>Back to Home</Button></div>;
  }

  const wins = bets.filter((b) => b.result === 'win').length;
  const losses = bets.length - wins;
  const totalWagered = bets.reduce((s, b) => s + parseFloat(String(b.amount)), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      {user.isAdmin && <><AdminBalancePanel /><AdminRequestsPanel /></>}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shrink-0 shadow-lg"><GeneratedAvatar username={user.username} size={80} /></div>
          <div><div className="text-xs font-mono uppercase tracking-[0.2em] text-ink-300 mb-2">Dashboard</div><h1 className="text-3xl md:text-4xl font-bold text-white">Welcome, {user.username}</h1><div className="flex items-center gap-2 mt-2"><p className="text-ink-300">Level {user.level} · Member since {new Date(user.joined).toLocaleDateString()}</p><span className="text-[10px] font-mono uppercase rounded-full border border-white/10 px-2 py-1 text-ink-300">{user.isAdmin ? 'Admin' : user.role}</span></div></div>
        </div>
        <div className="flex items-center gap-3">{user.verified && <Badge className="border-white/20"><Shield className="w-3.5 h-3.5" />KYC Verified</Badge>}<Button variant="outline" size="sm" onClick={logout}><LogOut className="w-4 h-4" />Sign Out</Button></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-1 p-8 relative overflow-hidden"><div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08), transparent 70%)' }} /><div className="relative z-10"><div className="flex items-center gap-2 text-ink-300 mb-2"><Wallet className="w-4 h-4" /><span className="text-xs font-mono uppercase tracking-wider">Balance</span></div><div className="text-4xl font-bold text-white font-display mb-1">{formatUSD(user.balance)}</div><div className="text-sm text-ink-300 mb-6">USD</div><div className="grid grid-cols-2 gap-3"><Button size="sm" onClick={() => openModal('deposit')}><ArrowDownToLine className="w-4 h-4" />Deposit</Button><Button size="sm" variant="outline" onClick={() => openModal('withdraw')}><ArrowUpFromLine className="w-4 h-4" />Withdraw</Button></div></div></Card>
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Total Wagered" value={formatUSD(totalWagered)} sub={`${bets.length} bets placed`} />
        <StatCard icon={<TrendingDown className="w-5 h-5" />} label="Win / Loss" value={`${wins} / ${losses}`} sub={bets.length > 0 ? `${Math.round((wins / bets.length) * 100)}% win rate` : 'No bets yet'} />
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-white/5"><TabBtn active={tab === 'overview'} onClick={() => setTab('overview')}>Recent Bets</TabBtn><TabBtn active={tab === 'history'} onClick={() => setTab('history')}>Transactions</TabBtn><TabBtn active={tab === 'settings'} onClick={() => setTab('settings')}>Settings</TabBtn></div>

      {tab === 'overview' && <Card className="overflow-hidden animate-fade-in"><div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-mono uppercase tracking-wider text-ink-300"><div className="col-span-3">Game</div><div className="col-span-3 text-right">Bet Amount</div><div className="col-span-2 text-right">Multiplier</div><div className="col-span-2 text-right">Payout</div><div className="col-span-2 text-right">Result</div></div>{loading?<div className="px-6 py-12 text-center text-ink-400 text-sm">Loading...</div>:bets.length===0?<div className="px-6 py-12 text-center text-ink-400 text-sm">No bets yet. <button onClick={()=>navigate('games')} className="text-white hover:underline">Play a game</button> to get started.</div>:bets.map(bet=><div key={bet.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"><div className="col-span-3 text-sm text-white">{bet.game}</div><div className="col-span-3 text-right font-mono text-sm text-ink-100">{formatUSD(parseFloat(String(bet.amount)))}</div><div className="col-span-2 text-right font-mono text-sm">{parseFloat(String(bet.multiplier))>0?<span className="text-white">{parseFloat(String(bet.multiplier))}x</span>:<span className="text-ink-400">—</span>}</div><div className="col-span-2 text-right font-mono text-sm">{bet.result==='win'?<span className="text-white">+{formatUSD(parseFloat(String(bet.payout)))}</span>:<span className="text-ink-400">{formatUSD(0)}</span>}</div><div className="col-span-2 text-right"><span className={cn('inline-flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded-full',bet.result==='win'?'bg-white/10 text-white':'text-ink-400')}><span className={cn('w-1.5 h-1.5 rounded-full',bet.result==='win'?'bg-white':'bg-ink-400')} />{bet.result==='win'?'WIN':'LOSS'}</span></div></div>)}</Card>}

      {tab === 'history' && <Card className="overflow-hidden animate-fade-in"><div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-mono uppercase tracking-wider text-ink-300"><div className="col-span-2">Type</div><div className="col-span-2 text-right">Amount</div><div className="col-span-2">Currency</div><div className="col-span-3">Date</div><div className="col-span-2">Status</div><div className="col-span-1 text-right">Tx</div></div>{loading?<div className="px-6 py-12 text-center text-ink-400 text-sm">Loading...</div>:transactions.length===0?<div className="px-6 py-12 text-center text-ink-400 text-sm">No transactions yet.</div>:transactions.map(tx=><div key={tx.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"><div className="col-span-2"><span className={cn('inline-flex items-center gap-1.5 text-xs font-mono uppercase px-2.5 py-1 rounded-full',tx.type==='deposit'&&'bg-white/10 text-white',tx.type==='withdraw'&&'text-ink-200 border border-white/10')}>{tx.type}</span></div><div className="col-span-2 text-right font-mono text-sm text-white">{tx.type==='withdraw'?'-':'+'}{formatUSD(parseFloat(String(tx.amount)))}</div><div className="col-span-2 text-sm text-ink-200">{tx.currency}</div><div className="col-span-3 text-sm text-ink-300 font-mono">{formatDateTime(tx.created_at)}</div><div className="col-span-2"><span className="inline-flex items-center gap-1.5 text-xs text-white"><span className="w-1.5 h-1.5 rounded-full bg-white" />{tx.status}</span></div><div className="col-span-1 text-right">{tx.tx_hash&&<button onClick={()=>{navigator.clipboard.writeText(tx.tx_hash||'').catch(()=>{});showToast('Transaction hash copied')}} className="text-ink-300 hover:text-white transition-colors inline-flex items-center gap-1 text-xs font-mono">{shortHash(tx.tx_hash)}<Copy className="w-3 h-3"/></button>}</div></div>)}</Card>}

      {tab === 'settings' && <div className="grid md:grid-cols-2 gap-6 animate-fade-in"><Card className="p-8"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl glass flex items-center justify-center"><UserIcon className="w-5 h-5 text-white" /></div><h3 className="font-bold text-white">Profile avatar</h3></div><div className="flex items-center gap-5"><GeneratedAvatar username={user.username} size={80}/><div><p className="text-sm text-ink-200 mb-2">Your avatar is generated automatically from your username.</p><p className="text-xs text-ink-400">Change your username to generate a different avatar.</p></div></div></Card><Card className="p-8"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl glass flex items-center justify-center"><UserIcon className="w-5 h-5 text-white" /></div><h3 className="font-bold text-white">Account</h3></div><div className="space-y-4"><SettingRow label="Username" value={user.username}/><SettingRow label="Email" value={user.email}/><SettingRow label="Member Since" value={new Date(user.joined).toLocaleDateString()}/><SettingRow label="Level" value={`Level ${user.level}`}/></div></Card><Card className="p-8"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl glass flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div><h3 className="font-bold text-white">Security</h3></div><div className="space-y-4"><ToggleRow label="Two-Factor Authentication" enabled={false} onToggle={()=>showToast('2FA toggle - coming soon')}/><ToggleRow label="Email Login Alerts" enabled={true} onToggle={()=>showToast('Alerts toggled')}/><ToggleRow label="Withdrawal Confirmations" enabled={true} onToggle={()=>showToast('Confirmations toggled')}/><div className="pt-4 border-t border-white/5"><div className="flex items-center gap-2 text-sm text-white mb-1"><Check className="w-4 h-4"/>Account Secured</div><p className="text-xs text-ink-300">Protected by Supabase Auth · Status: Active</p></div></div></Card><Card className="p-8 md:col-span-2"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl glass flex items-center justify-center"><Settings className="w-5 h-5 text-white" /></div><h3 className="font-bold text-white">Responsible Gaming Limits</h3></div><div className="grid sm:grid-cols-3 gap-4"><LimitCard label="Daily Deposit Limit" value={formatUSD(500)}/><LimitCard label="Weekly Loss Limit" value={formatUSD(2000)}/><LimitCard label="Session Time Limit" value="2 hours"/></div><div className="mt-6 flex gap-3"><Button variant="outline" size="sm" onClick={()=>showToast('Self-exclusion activated')}>Self-Exclude</Button><Button variant="ghost" size="sm" onClick={()=>showToast('Cool-down activated')}>Activate Cool-Down</Button></div></Card></div>}
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) { return <Card className="p-6"><div className="flex items-center gap-2 text-ink-300 mb-3"><span className="text-white">{icon}</span><span className="text-xs font-mono uppercase tracking-wider">{label}</span></div><div className="text-2xl font-bold text-white font-display mb-1">{value}</div><div className="text-xs text-ink-300">{sub}</div></Card>; }
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} className={cn('px-4 py-3 text-sm font-medium transition-colors relative -mb-px border-b-2',active?'text-white border-white':'text-ink-300 border-transparent hover:text-white')}>{children}</button>; }
function SettingRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0"><span className="text-sm text-ink-300">{label}</span><span className="text-sm text-white font-medium">{value}</span></div>; }
function ToggleRow({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) { const [on,setOn]=useState(enabled); return <div className="flex items-center justify-between py-2"><span className="text-sm text-ink-200">{label}</span><button onClick={()=>{setOn(!on);onToggle()}} className={cn('w-12 h-6 rounded-full transition-colors duration-300 relative',on?'bg-white':'bg-ink-600')}><span className={cn('absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300',on?'left-6 bg-black':'left-0.5 bg-white')}/></button></div>; }
function LimitCard({ label, value }: { label: string; value: string }) { return <div className="glass rounded-xl p-4"><div className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-2">{label}</div><div className="text-lg font-bold text-white font-display">{value}</div></div>; }
