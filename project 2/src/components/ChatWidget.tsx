import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { useApp } from '../store';
import { supabase } from '../lib/supabase';
import { cn, timeAgo } from '../utils';
import type { ChatMessageRow } from '../types';

export function ChatWidget() {
  const { user, openAuth, showToast } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !user) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setMessages((data as ChatMessageRow[]).reverse());
      }
      setLoading(false);
    };

    loadMessages();

    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessageRow]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!user) {
      openAuth('signup');
      return;
    }
    if (!input.trim() || sending) return;

    setSending(true);
    const { error } = await supabase.from('chat_messages').insert({
      username: user.username,
      message: input.trim(),
    });

    if (error) {
      showToast(error.message);
    } else {
      setInput('');
    }
    setSending(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl glass-strong flex items-center justify-center transition-all duration-300 hover:scale-110',
          open && 'rotate-90'
        )}
      >
        {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm glass-strong rounded-2xl flex flex-col animate-scale-in overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span className="text-sm font-bold text-white">Live Chat</span>
            </div>
            <span className="text-xs text-ink-300">{messages.length} messages</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 max-h-80 min-h-[200px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-ink-300 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-sm text-ink-400">
                No messages yet. Be the first to say something!
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="animate-slide-up">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className={cn(
                      'text-xs font-bold',
                      user && msg.username === user.username ? 'text-white' : 'text-ink-100'
                    )}>
                      {msg.username}
                    </span>
                    <span className="text-[10px] text-ink-400">{timeAgo(msg.created_at)}</span>
                  </div>
                  <p className="text-sm text-ink-200 leading-relaxed break-words">{msg.message}</p>
                </div>
              ))
            )}
          </div>

          <div className="px-5 py-4 border-t border-white/5">
            {user ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  maxLength={200}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-ink-400 glass rounded-xl px-4 py-2.5"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center transition-all hover:scale-105 disabled:opacity-30 disabled:pointer-events-none"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuth('signup')}
                className="w-full text-center text-sm text-ink-300 hover:text-white transition-colors py-2"
              >
                Sign in to join the conversation
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
