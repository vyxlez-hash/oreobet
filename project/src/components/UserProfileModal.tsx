import { useEffect, useState } from 'react';
import { X, Gift, Loader2, Shield, Crown, Swords, UserRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../store';
import { Card, Button } from '../ui';
import { formatUSD, formatDateTime } from '../utils';
import { GeneratedAvatar } from './GeneratedAvatar';

interface Props { username: string; onClose: () => void; }
interface Stats {
  id: string; username: string; balance: number; level: number; verified: boolean; role: string;
  created_at: string; total_wagered: number; wins: number; losses: number; games_played: number;
}

function RoleBadge({ role }: { role: string }) {
  const normalized = role || 'member';
  if (normalized === 'admin') return <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-mono uppercase text-white"><Shield className="w-3 h-3"/>Admin</span>;
  if (normalized === 'moderator') return <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-mono uppercase text-white"><Swords className="w-3 h-3"/>Mod</span>;
  if (normalized === 'vip') return <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-mono uppercase text-white"><Crown className="w-3 h-3"/>VIP</span>;
  return <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-mono uppercase text-ink-300"><UserRound className="w-3 h-3"/>Member</span>;
}

export function UserProfileModal({ username, onClose }: Props) {
  const { user, showToast, refreshBalance } = useApp();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tip, setTip] = useState('');
  const [tipping, setTipping] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    supabase.rpc('get_public_user_stats', { target_username: username }).then(({ data, error }) => {
      if (!alive) return;
      if (error) showToast(error.message);
      setStats((data as Stats) || null);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [username, showToast]);

  const doTip = async () => {
    const amount = Number(tip);
    if (!user) return showToast('Sign in to tip users.');
    if (!Number.isFinite(amount) || amount <= 0) return showToast('Enter a valid tip amount.');
    setTipping(true);
    const { data, error } = await supabase.rpc('tip_user', { target_username: username, tip_amount: amount });
    setTipping(false);
    if (error) return showToast(error.message);
    setTip('');
    await refreshBalance();
    showToast(`Tipped @${data.to} ${formatUSD(Number(data.amount))}`);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={onClose}>
      <Card className="w-full max-w-md p-6 relative animate-scale-in" onMouseDown={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 w-9 h-9 rounded-xl glass flex items-center justify-center text-ink-200 hover:text-white"><X className="w-4 h-4"/></button>
        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-ink-300"/></div>
        ) : !stats ? (
          <div className="py-10 text-center text-ink-300">User not found.</div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-7">
              <GeneratedAvatar username={stats.username} size={76}/>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-white truncate">{stats.username}</h2>
                  <RoleBadge role={stats.role}/>
                </div>
                <p className="text-sm text-ink-300">Level {stats.level} · Joined {formatDateTime(stats.created_at)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <Stat label="Games" value={String(stats.games_played)}/>
              <Stat label="Win / Loss" value={`${stats.wins} / ${stats.losses}`}/>
              <Stat label="Wagered" value={formatUSD(Number(stats.total_wagered))}/>
              <Stat label="Balance" value={formatUSD(Number(stats.balance))}/>
            </div>

            {user && user.username.toLowerCase() !== stats.username.toLowerCase() && (
              <div className="border-t border-white/5 pt-5">
                <div className="flex items-center gap-2 mb-3"><Gift className="w-4 h-4 text-white"/><span className="text-sm font-bold text-white">Tip {stats.username}</span></div>
                <div className="flex gap-2">
                  <div className="flex-1 glass rounded-xl px-4 py-3 flex items-center gap-2"><span className="text-ink-400">$</span><input value={tip} onChange={e => setTip(e.target.value.replace(/[^0-9.]/g,''))} placeholder="Amount" className="w-full bg-transparent outline-none text-white" inputMode="decimal"/></div>
                  <Button onClick={doTip} disabled={tipping}>{tipping ? <Loader2 className="w-4 h-4 animate-spin"/> : <Gift className="w-4 h-4"/>}Tip</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="glass rounded-xl p-4"><div className="text-[10px] uppercase tracking-wider font-mono text-ink-400 mb-1">{label}</div><div className="text-white font-bold text-sm">{value}</div></div>;
}
