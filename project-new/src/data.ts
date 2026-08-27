import type { Game, BetRecord } from './types';

export const games: Game[] = [
  { id: 'dice', name: 'Dice', description: 'Roll under your target. Classic provably fair.', icon: 'Dices', edge: 1.0, minBet: 0.10, maxBet: 10000, players: 1284 },
  { id: 'crash', name: 'Crash', description: 'Cash out before the multiplier crashes.', icon: 'Rocket', edge: 1.0, minBet: 0.10, maxBet: 10000, players: 2417 },
  { id: 'roulette', name: 'Roulette', description: 'European single-zero. Place your bets.', icon: 'Disc', edge: 2.7, minBet: 0.10, maxBet: 5000, players: 893 },
  { id: 'blackjack', name: 'Blackjack', description: 'Beat the dealer to 21. Hit or stand.', icon: 'Spade', edge: 0.5, minBet: 0.10, maxBet: 5000, players: 1567 },
  { id: 'coinflip', name: 'Coinflip', description: 'Heads or tails. Fifty-fifty fury.', icon: 'Coins', edge: 1.0, minBet: 0.10, maxBet: 10000, players: 642 },
  { id: 'mines', name: 'Mines', description: 'Reveal gems, avoid mines. Cash out anytime.', icon: 'Bomb', edge: 1.0, minBet: 0.10, maxBet: 10000, players: 1923 },
];

const usernames = [
  'crypto_king', 'whale_77', 'lucky_ace', 'shadow_btc', 'moon_rider',
  'diamond_hands', 'neon_fox', 'phantom_x', 'iceberg', 'vortex',
  'satoshi_jr', 'blaze_42', 'nova_strk', 'pixel_pusher', 'apex_predator',
  'frost_bite', 'gold_rush', 'synth_wave', 'dark_pool', 'limit_order',
];

const gameNames = ['Dice', 'Crash', 'Roulette', 'Blackjack', 'Coinflip', 'Mines'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFloat(min: number, max: number, decimals = 2): number {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

export function generateLiveBets(count: number): BetRecord[] {
  return Array.from({ length: count }, (_, i) => {
    const amount = randomFloat(1, 500, 2);
    const isWin = Math.random() > 0.52;
    const multiplier = isWin ? randomFloat(1.01, 24.5, 2) : 0;
    const payout = isWin ? parseFloat((amount * multiplier).toFixed(2)) : 0;
    return {
      id: `bet-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      game: randomItem(gameNames),
      amount, multiplier, payout,
      result: isWin ? 'win' : 'loss',
      time: `${Math.floor(Math.random() * 60)}s ago`,
      user: randomItem(usernames),
    };
  });
}

export function generateHighRollers(count: number): BetRecord[] {
  return Array.from({ length: count }, (_, i) => {
    const amount = randomFloat(100, 5000, 2);
    const isWin = Math.random() > 0.48;
    const multiplier = isWin ? randomFloat(1.5, 50, 2) : 0;
    const payout = isWin ? parseFloat((amount * multiplier).toFixed(2)) : 0;
    return {
      id: `hr-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      game: randomItem(gameNames),
      amount, multiplier, payout,
      result: isWin ? 'win' : 'loss',
      time: `${Math.floor(Math.random() * 60)}s ago`,
      user: randomItem(usernames),
    };
  });
}

export const promotions = [
  { id: 'welcome', title: 'Welcome Bonus', badge: 'NEW', description: 'Get 100% match on your first deposit up to $500. Automatically credited to your balance.', reward: '100% up to $500', code: 'OREO100', active: true },
  { id: 'rakeback', title: 'Daily Rakeback', badge: 'DAILY', description: 'Earn up to 10% rakeback on every bet placed, paid out daily to your account.', reward: 'Up to 10% back', code: 'RAKE10', active: true },
  { id: 'weekly', title: 'Weekly Cashback', badge: 'WEEKLY', description: 'Losses hurt less. Get 5% weekly cashback on net losses, every Monday.', reward: '5% net losses', code: 'CASHBACK5', active: true },
  { id: 'vip', title: 'VIP Club', badge: 'VIP', description: 'Exclusive perks, higher limits, personal manager, and custom promotions for high rollers.', reward: 'Custom rewards', code: 'INVITE ONLY', active: false },
];

export const cryptoCurrencies = [
  { code: 'BTC' as const, name: 'Bitcoin', icon: '₿' },
  { code: 'SOL' as const, name: 'Solana', icon: '◎' },
  { code: 'LTC' as const, name: 'Litecoin', icon: 'Ł' },
  { code: 'ETH' as const, name: 'Ethereum', icon: 'Ξ' },
];
