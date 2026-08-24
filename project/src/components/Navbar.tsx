import { useState, useEffect } from 'react';
import { Menu, X, Wallet, UserRound } from 'lucide-react';
import { useApp } from '../store';
import { Logo, LogoMark } from './Logo';
import { Button } from '../ui';
import { cn, formatUSD } from '../utils';
import type { PageId } from '../types';

const navItems: { id: PageId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'games', label: 'Games' },
  { id: 'live', label: 'Live' },
  { id: 'promotions', label: 'Promotions' },
  { id: 'fair', label: 'Provably Fair' },
  { id: 'support', label: 'Support' },
];

export function Navbar() {
  const { page, navigate, openAuth, user, logout, openModal } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (id: PageId) => {
    navigate(id);
    setMobileOpen(false);
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-out-expo',
          scrolled ? 'glass-strong border-b border-white/5' : 'bg-transparent'
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <button onClick={() => handleNav('home')} className="flex items-center gap-2.5 group">
              <LogoMark className="w-8 h-8 transition-transform duration-500 group-hover:rotate-180" />
              <Logo />
            </button>

            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={cn(
                    'relative px-4 py-2 text-sm font-medium transition-colors duration-300',
                    page === item.id ? 'text-white' : 'text-ink-200 hover:text-white'
                  )}
                >
                  {item.label}
                  {page === item.id && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
                  )}
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <>
                  <button
                    onClick={() => handleNav('dashboard')}
                    className="flex items-center gap-2.5 glass px-3.5 py-2.5 rounded-xl hover:bg-white/10 transition-all duration-300"
                    title={`@${user.username}`}
                  >
                    <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                      <UserRound className="w-4 h-4 text-white" />
                    </span>
                    <span className="text-sm text-white max-w-28 truncate">@{user.username}</span>
                    <span className="h-4 w-px bg-white/10" />
                    <Wallet className="w-4 h-4 text-white" />
                    <span className="font-mono text-sm text-white">{formatUSD(user.balance)}</span>
                  </button>
                  <Button size="sm" variant="outline" onClick={logout}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="ghost" onClick={() => openAuth('login')}>
                    Login
                  </Button>
                  <Button size="sm" onClick={() => openAuth('signup')}>
                    Sign Up
                  </Button>
                </>
              )}
            </div>

            <button
              className="lg:hidden text-white p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {mobileOpen && (
          <div className="lg:hidden glass-strong border-t border-white/5 animate-slide-up">
            <div className="px-4 py-6 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={cn(
                    'block w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    page === item.id ? 'bg-white/10 text-white' : 'text-ink-200 hover:bg-white/5'
                  )}
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 space-y-2">
                {user ? (
                  <>
                    <button
                      onClick={() => handleNav('dashboard')}
                      className="flex items-center justify-between w-full glass px-4 py-3 rounded-xl"
                    >
                      <span className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        <span className="font-mono text-sm">{formatUSD(user.balance)}</span>
                      </span>
                      <span className="text-xs text-ink-200">Dashboard</span>
                    </button>
                    <Button className="w-full" variant="outline" onClick={logout}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="w-full" variant="outline" onClick={() => { openAuth('login'); setMobileOpen(false); }}>
                      Login
                    </Button>
                    <Button className="w-full" onClick={() => { openAuth('signup'); setMobileOpen(false); }}>
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
      <div className="h-16 md:h-20" />
    </>
  );
}
