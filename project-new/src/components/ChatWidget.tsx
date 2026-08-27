import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Shield, Crown, Swords, UserRound, CloudRain, Trash2, VolumeX } from 'lucide-react';
import { useApp } from '../store';
import { supabase } from '../lib/supabase';
import { cn, timeAgo, formatUSD } from '../utils';
import type { ChatMessageRow } from '../types';
import { GeneratedAvatar } from './GeneratedAvatar';
import { UserProfileModal } from './UserProfileModal';

function RoleBadge({ role, system = false }: { role?: string; system?: boolean }) {
  if (system || role === 'system') return <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-sky-300"><Shield className="w-3 h-3"/>System</span>;
  if (role === 'admin') return <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-white"><Shield className="w-3 h-3"/>Admin</span>;
  if (role === 'moderator') return <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-white"><Swords className="w-3 h-3"/>Mod</span>;
  if (role === 'vip') return <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-white"><Crown className="w-3 h-3"/>VIP</span>;
  return <span className="text-[10px] font-mono uppercase text-ink-500">Member</span>;
}

export function ChatWidget() {
  const { user, openAuth, showToast, refreshBalance } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [rain, setRain] = useState<{ amount: number; ends_at: string } | null>(null);
  const [, setClock] = useState(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadRain = async () => {
    const { data } = await supabase.from('rain_events').select('amount, ends_at').eq('active', true).gt('ends_at', new Date().toISOString()).order('started_at', { ascending: false }).limit(1).maybeSingle();
    setRain(data ? { amount: Number(data.amount), ends_at: data.ends_at } : null);
  };

  useEffect(() => {
    if (!open || !user) return;
    let alive = true;
    const loadMessages = async () => {
      const { data, error } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(80);
      if (!alive) return;
      if (!error && data) setMessages((data as ChatMessageRow[]).reverse());
      setLoading(false);
    };
    loadMessages();
    loadRain();
    const channel = supabase.channel('chat_messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
      setMessages(prev => [...prev, payload.new as ChatMessageRow].slice(-100));
    }).subscribe();
    const rainChannel = supabase.channel('rain_events').on('postgres_changes', { event: '*', schema: 'public', table: 'rain_events' }, loadRain).subscribe();
    const timer = window.setInterval(loadRain, 15000);
    return () => { alive = false; window.clearInterval(timer); supabase.removeChannel(channel); supabase.removeChannel(rainChannel); };
  }, [open, user]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const sendMessage = async () => {
    if (!user) return openAuth('signup');
    const text = input.trim();
    if (!text || sending) return;
    if (user.mutedUntil && new Date(user.mutedUntil) > new Date()) return showToast(`You are muted until ${new Date(user.mutedUntil).toLocaleTimeString()}.`);
    setSending(true);

    if (text.startsWith('/')) {
      const parts = text.split(/\s+/);
      const command = parts[0].toLowerCase();
      let error: string | null = null;
      if (command === '/clear') {
        const { error: e } = await supabase.rpc('clear_chat'); error = e?.message || null;
        if (!error) setMessages([]);
      } else if (command === '/mute') {
        if (!parts[1]) error = 'Usage: /mute username [minutes]';
        else { const minutes = Number(parts[2] || 10); const { error: e } = await supabase.rpc('mute_user', { target_username: parts[1], duration_minutes: minutes }); error = e?.message || null; }
      } else if (command === '/unmute') {
        if (!parts[1]) error = 'Usage: /unmute username';
        else { const { error: e } = await supabase.rpc('unmute_user', { target_username: parts[1] }); error = e?.message || null; }
      } else if (command === '/rain') {
        if (parts[1]?.toLowerCase() !== 'start') error = 'Usage: /rain start amount minutes';
        else { const amount = Number(parts[2]); const minutes = Number(parts[3]); if (!Number.isFinite(amount) || !Number.isFinite(minutes)) error = 'Usage: /rain start amount minutes'; else { const { error: e } = await supabase.rpc('start_rain', { rain_amount: amount, duration_minutes: minutes }); error = e?.message || null; await loadRain(); } }
      } else if (command === '/tip') {
        if (!parts[1] || !parts[2]) error = 'Usage: /tip username amount';
        else { const amount = Number(parts[2]); const { data, error: e } = await supabase.rpc('tip_user', { target_username: parts[1], tip_amount: amount }); error = e?.message || null; if (!error) { await refreshBalance(); showToast(`Tipped @${data.to} ${formatUSD(Number(data.amount))}`); } }
      } else {
        error = 'Unknown command. Try /clear, /mute, /unmute, /rain start amount minutes, or /tip username amount.';
      }
      if (error) showToast(error); else if (command !== '/rain') showToast('Command executed.');
      setInput(''); setSending(false); return;
    }

    const { error } = await supabase.from('chat_messages').insert({ username: user.username, message: text, role: user.isAdmin ? 'admin' : user.role, message_type: 'user' });
    if (error) showToast(error.message); else setInput('');
    setSending(false);
  };

  const canModerate = Boolean(user?.isAdmin || user?.role === 'moderator' || user?.role === 'admin');
  useEffect(() => { if (!open || !rain) return; const t = window.setInterval(() => setClock(Date.now()), 1000); return () => window.clearInterval(t); }, [open, rain]);

  const rainSeconds = rain ? Math.max(0, Math.floor((new Date(rain.ends_at).getTime() - Date.now()) / 1000)) : 0;

  return <>
    <button onClick={() => setOpen(!open)} className={cn('fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl glass-strong flex items-center justify-center transition-all duration-300 hover:scale-110', open && 'rotate-90')}>
      {open ? <X className="w-6 h-6 text-white"/> : <MessageCircle className="w-6 h-6 text-white"/>}
    </button>

    {open && <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] max-w-md glass-strong rounded-2xl flex flex-col animate-scale-in overflow-hidden shadow-2xl">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-white"/></span><span className="text-sm font-bold text-white">Live Chat</span></div>
        <span className="text-xs text-ink-300">{messages.length} messages</span>
      </div>
      {rain && <div className="px-5 py-3 bg-white/[0.05] border-b border-white/5 flex items-center gap-3"><CloudRain className="w-5 h-5 text-white"/><div className="min-w-0"><div className="text-sm font-bold text-white">Rain {formatUSD(rain.amount)} pool</div><div className="text-xs text-ink-300">Ends in {Math.floor(rainSeconds/60)}:{String(rainSeconds%60).padStart(2,'0')}</div></div></div>}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-h-[420px] min-h-[230px]">
        {loading ? <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-ink-300 animate-spin"/></div> : messages.length === 0 ? <div className="text-center py-8 text-sm text-ink-400">No messages yet. Be the first to say something!</div> : messages.map(msg => {
          const system = msg.message_type === 'system' || msg.role === 'system' || msg.username === 'System';
          return <div key={msg.id} className="animate-slide-up flex gap-2.5">
            <button onClick={() => !system && setSelectedUser(msg.username)} className="w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shrink-0 mt-0.5 hover:scale-105 transition-transform">
              {system ? <Shield className="w-4 h-4 text-sky-300"/> : <GeneratedAvatar username={msg.username} size={36}/>} 
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <button onClick={() => !system && setSelectedUser(msg.username)} className={cn('text-xs font-bold hover:underline', system ? 'text-sky-300' : user && msg.username === user.username ? 'text-white' : 'text-ink-100')}>{msg.username}</button>
                <RoleBadge role={msg.role} system={system}/>
                <span className="text-[10px] text-ink-500">{timeAgo(msg.created_at)}</span>
                {canModerate && !system && <button onClick={() => setSelectedUser(msg.username)} className="ml-auto text-ink-500 hover:text-white"><UserRound className="w-3.5 h-3.5"/></button>}
              </div>
              <p className={cn('text-sm leading-relaxed break-words', system ? 'text-ink-200' : 'text-ink-200')}>{msg.message}</p>
            </div>
          </div>;
        })}
      </div>

      <div className="px-5 py-3 border-t border-white/5">
        {canModerate && <div className="flex items-center gap-2 mb-2 text-[10px] text-ink-400"><span>Staff:</span><span className="glass rounded-md px-2 py-1"><Trash2 className="inline w-3 h-3 mr-1"/>/clear</span><span className="glass rounded-md px-2 py-1"><VolumeX className="inline w-3 h-3 mr-1"/>/mute user 10</span><span className="glass rounded-md px-2 py-1">/rain start 100 5</span></div>}
        {user ? <div className="flex items-center gap-2"><input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}} maxLength={250} placeholder={user.mutedUntil && new Date(user.mutedUntil)>new Date() ? 'You are muted...' : 'Type a message or /command...'} disabled={Boolean(user.mutedUntil && new Date(user.mutedUntil)>new Date())} className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-ink-400 glass rounded-xl px-4 py-2.5 disabled:opacity-50"/><button onClick={sendMessage} disabled={sending || !input.trim() || Boolean(user.mutedUntil && new Date(user.mutedUntil)>new Date())} className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center transition-all hover:scale-105 disabled:opacity-30 disabled:pointer-events-none">{sending?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}</button></div> : <button onClick={()=>openAuth('signup')} className="w-full text-center text-sm text-ink-300 hover:text-white transition-colors py-2">Sign in to join the conversation</button>}
      </div>
    </div>}
    {selectedUser && <UserProfileModal username={selectedUser} onClose={() => setSelectedUser(null)}/>} 
  </>;
}
