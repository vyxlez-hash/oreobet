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
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  saveUsername: (username: string) => Promise<{ error: string | null }>;
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
        usernameChosen: Boolean(newProfile.username_chosen),
        isAdmin: Boolean(newProfile.is_admin),
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
      usernameChosen: Boolean(data.username_chosen),
      isAdmin: Boolean(data.is_admin),
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

  const signUp = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (error) return { error: error.message };
    if (!data.user) return { error: 'Failed to create account' };

    if (data.session) {
      const profile = await fetchProfile(data.user.id, data.user.email || cleanEmail);
      if (!profile) return { error: 'Account created, but your profile could not be loaded.' };
      setSession(data.session);
      setUser(profile);
      setAuthOpen(false);
      showToast('Account created. Choose your username.');
    } else {
      showToast('Account created. Check your email to confirm your account, then sign in.');
      setAuthOpen(false);
    }

    return { error: null };
  }, [fetchProfile, showToast]);

  const saveUsername = useCallback(async (username: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'You must be signed in.' };
    const cleanUsername = username.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
      return { error: 'Username must be 3-20 characters and use only letters, numbers, or underscores.' };
    }

    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', cleanUsername)
      .neq('id', user.id)
      .maybeSingle();

    if (checkError) return { error: checkError.message };
    if (existing) return { error: 'That username is already taken.' };

    const { data, error } = await supabase
      .from('profiles')
      .update({ username: cleanUsername, username_chosen: true })
      .eq('id', user.id)
      .select('*')
      .single();

    if (error || !data) return { error: error?.message || 'Could not save username.' };

    setUser((prev) => prev ? {
      ...prev,
      username: data.username,
      usernameChosen: true,
      isAdmin: Boolean(data.is_admin),
    } : prev);
    showToast(`Username set to @${cleanUsername}`);
    return { error: null };
  }, [user, showToast]);


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
        signUp, signIn, logout, refreshBalance, saveUsername,
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
