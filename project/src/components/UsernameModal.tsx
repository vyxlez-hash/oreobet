import { useEffect, useState } from 'react';
import { Check, Loader2, UserRound } from 'lucide-react';
import { useApp } from '../store';
import { Button } from '../ui';

export function UsernameModal() {
  const { user, saveUsername } = useApp();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !user.usernameChosen) {
      setUsername('');
      setError(null);
    }
  }, [user?.id, user?.usernameChosen]);

  if (!user || user.usernameChosen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await saveUsername(username);
    if (result.error) setError(result.error);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl glass-strong p-8 border border-white/10 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-5">
          <UserRound className="w-8 h-8 text-white" />
        </div>
        <div className="text-center mb-7">
          <h2 className="text-2xl font-bold text-white">Choose your username</h2>
          <p className="text-sm text-ink-300 mt-2">This is the name other OREOBET users will see.</p>
        </div>

        {error && <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">{error}</div>}

        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-2 block">Username</span>
            <div className="flex items-center gap-3 glass rounded-xl px-4 py-3.5 focus-within:border-white/20">
              <span className="text-ink-300">@</span>
              <input
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                className="w-full bg-transparent text-white focus:outline-none"
                placeholder="yourname"
                minLength={3}
                maxLength={20}
                required
              />
            </div>
            <span className="text-xs text-ink-400 mt-2 block">3–20 characters · letters, numbers and underscores</span>
          </label>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            {loading ? 'SAVING...' : 'CONTINUE'}
          </Button>
        </form>
      </div>
    </div>
  );
}
