export type GameId = 'dice' | 'crash' | 'roulette' | 'blackjack' | 'coinflip' | 'mines';

export interface Game {
  id: GameId;
  name: string;
  description: string;
  icon: string;
  edge: number;
  minBet: number;
  maxBet: number;
  players: number;
}

export interface BetRecord {
  id: string;
  game: string;
  amount: number;
  multiplier: number;
  payout: number;
  result: 'win' | 'loss';
  time: string;
  user: string;
}

export interface TransactionRow {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  currency: 'LTC' | 'SOL' | 'ETH';
  status: 'pending' | 'completed' | 'failed';
  tx_hash: string | null;
  created_at: string;
}

export interface BetRow {
  id: string;
  user_id: string;
  game: string;
  amount: number;
  multiplier: number;
  payout: number;
  result: 'win' | 'loss';
  created_at: string;
}

export interface ChatMessageRow {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  role?: string;
  message_type?: 'user' | 'system';
  message: string;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  username: string;
  balance: number;
  level: number;
  verified: boolean;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

export type PageId =
  | 'home'
  | 'games'
  | 'live'
  | 'promotions'
  | 'fair'
  | 'support'
  | 'dashboard'
  | 'play-dice'
  | 'play-crash'
  | 'play-roulette'
  | 'play-blackjack'
  | 'play-coinflip'
  | 'play-mines';

export interface AppUser {
  id: string;
  email: string;
  username: string;
  balance: number;
  level: number;
  verified: boolean;
  avatarUrl: string | null;
  usernameChosen: boolean;
  isAdmin: boolean;
  role: string;
  mutedUntil: string | null;
  joined: string;
}

export type CryptoCurrency = 'LTC' | 'SOL' | 'ETH';
