import { AppProvider, useApp } from './store';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { ChatWidget } from './components/ChatWidget';
import { Toast } from './components/Toast';
import { HomePage } from './pages/HomePage';
import { GamesPage } from './pages/GamesPage';
import { LivePage } from './pages/LivePage';
import { PromotionsPage } from './pages/PromotionsPage';
import { FairPage } from './pages/FairPage';
import { SupportPage } from './pages/SupportPage';
import { DashboardPage } from './pages/DashboardPage';
import { DiceGame } from './pages/games/DiceGame';
import { GameComingSoon } from './pages/games/GameComingSoon';
import type { PageId } from './types';

function Router() {
  const { page } = useApp();

  const pages: Record<PageId, React.ReactNode> = {
    home: <HomePage />,
    games: <GamesPage />,
    live: <LivePage />,
    promotions: <PromotionsPage />,
    fair: <FairPage />,
    support: <SupportPage />,
    dashboard: <DashboardPage />,
    'play-dice': <DiceGame />,
    'play-crash': <GameComingSoon gameId="crash" />,
    'play-roulette': <GameComingSoon gameId="roulette" />,
    'play-blackjack': <GameComingSoon gameId="blackjack" />,
    'play-coinflip': <GameComingSoon gameId="coinflip" />,
    'play-mines': <GameComingSoon gameId="mines" />,
  };

  return <main className="min-h-screen">{pages[page]}</main>;
}

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-ink-950 text-ink-50 noise-overlay">
        <Navbar />
        <Router />
        <Footer />
        <AuthModal />
        <DepositModal />
        <WithdrawModal />
        <ChatWidget />
        <Toast />
      </div>
    </AppProvider>
  );
}

export default App;
