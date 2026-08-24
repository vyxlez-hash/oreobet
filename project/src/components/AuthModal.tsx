import { useState, useEffect } from 'react';
import { X, Mail, Lock, User as UserIcon, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '../store';
import { Button } from '../ui';

export function AuthModal() {
  const { isAuthOpen, authMode, closeAuth, signIn, signUp } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthOpen) {
      document.body.style.overflow = 'hidden';
      setError(null);
      setLoading(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isAuthOpen]);

  if (!isAuthOpen) return null;

  const isSignup = authMode === 'signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (isSignup) {
      const { error: err } = await signUp(email, password, username);
      if (err) setError(err);
    } else {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeAuth} />
      <div className="relative glass-strong rounded-3xl w-full max-w-md p-8 animate-scale-in noise-overlay">
        <button
          onClick={closeAuth}
          className="absolute top-4 right-4 text-ink-300 hover:text-white transition-colors p-2"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass mb-4">
            <span className="font-display font-bold text-2xl text-white">O</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-ink-300 mt-2">
            {isSignup ? 'Join OREOBET and start playing' : 'Sign in to continue to your dashboard'}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 glass rounded-xl px-4 py-3 text-sm text-white border border-white/10">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <Field icon={<UserIcon className="w-4 h-4" />} label="Username">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-ink-400"
                placeholder="Choose a username"
                required
                minLength={3}
                maxLength={20}
              />
            </Field>
          )}
          <Field icon={<Mail className="w-4 h-4" />} label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-ink-400"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </Field>
          <Field icon={<Lock className="w-4 h-4" />} label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-ink-400"
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
          </Field>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {isSignup ? 'CREATE ACCOUNT' : 'SIGN IN'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-2 block">{label}</span>
      <div className="flex items-center gap-3 glass rounded-xl px-4 py-3.5 focus-within:border-white/20 transition-colors">
        <span className="text-ink-300">{icon}</span>
        {children}
      </div>
    </label>
  );
}
