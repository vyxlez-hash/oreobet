import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import type { PageId, AppUser } from './types';

type ModalType = 'auth' | 'deposit' | 'withdraw' | null;

interface AppState {
  page: PageId;
  navigate: (page: PageId) => void;
  user: AppUser | null;
  session: Session | null;
  authLoading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  openAuth: (mode: 'login' | 'signup') => void;
  closeAuth: () => void;
  isAuthOpen: boolean;
  authMode: 'login' | 'signup';
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  activeModal: ModalType;
  toast: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<PageId>('home');
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const navigate = useCallback((p: PageId) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const openAuth = useCallback((mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const openModal = useCallback((modal: ModalType) => setActiveModal(modal), []);
  const closeModal = useCallback(() => setActiveModal(null), []);

  const fetchProfile = useCallback(async (uid: string, email: string): Promise<AppUser | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error) {
      console.error('Profile fetch error:', error.message);
      return null;
    }

    if (!data) {
      const username = email.split('@')[0] + '_' + Math.random().toString(36).slice(2, 6);
      const { data: newProfile, error: insertErr } = await supabase
        .from('profiles')
        .insert({ id: uid, username, balance: 0, level: 1, verified: false })
        .select('*')
        .maybeSingle();

      if (insertErr || !newProfile) {
        console.error('Profile creation error:', insertErr?.message);
        return null;
      }

      return {
        id: newProfile.id,
        email,
        username: newProfile.username,
        balance: parseFloat(newProfile.balance) || 0,
        level: newProfile.level,
        verified: newProfile.verified,
        joined: newProfile.created_at,
      };
    }

    return {
      id: data.id,
      email,
      username: data.username,
      balance: parseFloat(data.balance) || 0,
      level: data.level,
      verified: data.verified,
      joined: data.created_at,
    };
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data) {
      setUser((prev) => prev ? { ...prev, balance: parseFloat(data.balance) || 0 } : prev);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        fetchProfile(s.user.id, s.user.email || '').then((u) => {
          if (mounted) {
            setUser(u);
            setAuthLoading(false);
          }
        });
      } else {
        setAuthLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;

      // Keep the auth callback synchronous. Calling Supabase queries directly
      // inside onAuthStateChange can deadlock the auth lock during sign-in.
      setSession(s);

      if (event === 'SIGNED_OUT' || !s?.user) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        setAuthLoading(true);
        setTimeout(async () => {
          if (!mounted) return;
          const u = await fetchProfile(s.user.id, s.user.email || '');
          if (mounted) {
            setUser(u);
            setAuthLoading(false);
          }
        }, 0);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, username: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return { error: 'Username must be between 3 and 20 characters' };
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { username: cleanUsername },
      },
    });

    if (error) return { error: error.message };
    if (!data.user) return { error: 'Failed to create account' };

    // The database trigger creates the profile safely, including when
    // Supabase email confirmation is enabled and there is no session yet.
    if (data.session) {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ username: cleanUsername })
        .eq('id', data.user.id);

      if (profileErr) {
        console.error('Profile update error:', profileErr.message);
        return { error: 'Account created, but your profile could not be saved. Please try signing in again.' };
      }

      setAuthOpen(false);
      showToast(`Welcome to OREOBET, ${cleanUsername}!`);
    } else {
      showToast('Account created. Check your email to confirm your account, then sign in.');
      setAuthOpen(false);
    }

    return { error: null };
  }, [showToast]);


  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return { error: 'Please confirm your email before signing in.' };
      }
      return { error: error.message };
    }

    if (!data.user || !data.session) {
      return { error: 'Login failed: Supabase did not create a session.' };
    }

    // Load the profile immediately so the UI does not have to wait for
    // the auth-state callback.
    const profile = await fetchProfile(data.user.id, data.user.email || cleanEmail);
    if (!profile) {
      return { error: 'Login worked, but your profile could not be loaded. Please try again.' };
    }

    setSession(data.session);
    setUser(profile);
    setAuthOpen(false);
    showToast('Welcome back!');
    return { error: null };
  }, [fetchProfile, showToast]);


  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setPage('home');
    showToast('Signed out');
  }, [showToast]);

  return (
    <AppContext.Provider
      value={{
        page, navigate, user, session, authLoading,
        signUp, signIn, logout, refreshBalance,
        openAuth, closeAuth, isAuthOpen, authMode,
        openModal, closeModal, activeModal,
        toast, showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
