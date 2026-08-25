import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Shield,
  Bomb,
  Coins,
  Rocket,
  Disc3,
  Spade,
  Sparkles,
} from 'lucide-react';

import { useApp } from '../../store';
import { supabase } from '../../lib/supabase';
import { Button, Card } from '../../ui';
import { cn, formatUSD } from '../../utils';
import type { GameId } from '../../types';
import { games } from '../../data';

type CasinoResult = {
  won?: boolean;
  payout?: number;
  multiplier?: number;
  side?: string;
  number?: number;
  crash?: number;
  player_total?: number;
  dealer_total?: number;
  cell?: number;
};

export function CasinoGame({
  gameId,
}: {
  gameId: Exclude<GameId, 'dice'>;
}) {
  const {
    navigate,
    user,
    openAuth,
    showToast,
    refreshBalance,
  } = useApp();

  const game = games.find((g) => g.id === gameId)!;

  const [bet, setBet] = useState(1);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CasinoResult | null>(null);
  const [choice, setChoice] = useState(
    gameId === 'coinflip'
      ? 'heads'
      : gameId === 'roulette'
        ? 'red'
        : gameId === 'crash'
          ? '2.00'
          : '',
  );

  const [mineCount, setMineCount] = useState(3);
  const [cell, setCell] = useState<number | null>(null);

  // Animation state is deliberately separate from the server result.
  const [animationKey, setAnimationKey] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const isWin = Boolean(result?.won);

  const detail = useMemo(() => {
    if (!result) return '';

    if (result.player_total !== undefined) {
      return `You ${result.player_total} · Dealer ${result.dealer_total ?? '?'}`;
    }

    if (result.side) {
      return result.side.toUpperCase();
    }

    if (result.number !== undefined) {
      return `Number ${result.number}`;
    }

    if (result.crash !== undefined) {
      return `Crashed at ${Number(result.crash).toFixed(2)}x`;
    }

    if (result.cell !== undefined) {
      return `Cell ${Number(result.cell) + 1}`;
    }

    return '';
  }, [result]);

  const play = async (extraChoice?: string) => {
    if (!user) {
      openAuth('signup');
      return;
    }

    if (bet <= 0 || bet > user.balance) {
      showToast('Insufficient balance.');
      return;
    }

    setBusy(true);
    setResult(null);
    setShowResult(false);
    setAnimationKey((key) => key + 1);

    const selected =
      extraChoice ??
      (gameId === 'mines'
        ? `${mineCount}:${cell ?? Math.floor(Math.random() * 25)}`
        : choice);

    const { data, error } = await supabase.rpc('play_casino_game', {
      p_game: game.name,
      p_amount: bet,
      p_choice: selected,
    });

    if (error) {
      setBusy(false);
      showToast(error.message);
      return;
    }

    /*
     * Keep the server result as the source of truth.
     * The UI animation simply plays before revealing it.
     */
    const animationDuration =
      gameId === 'roulette'
        ? 2800
        : gameId === 'coinflip'
          ? 1800
          : gameId === 'blackjack'
            ? 1500
            : gameId === 'crash'
              ? 1800
              : 700;

    window.setTimeout(async () => {
      setResult(data);
      setShowResult(true);
      setBusy(false);

      await refreshBalance();

      if (data.won) {
        showToast(`Won ${formatUSD(Number(data.payout))}!`);
      } else {
        showToast(`Lost ${formatUSD(bet)}.`);
      }
    }, animationDuration);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <button
        onClick={() => navigate('games')}
        className="inline-flex items-center gap-2 text-ink-300 hover:text-white transition-colors mb-8 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Games
      </button>

      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center">
          <GameIcon gameId={gameId} />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white">
            {game.name}
          </h1>

          <p className="text-ink-300 text-sm">
            {game.description}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-8 min-h-[500px] flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center relative">

            {/* Ambient glow */}
            <div
              className={cn(
                'absolute w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700',
                result?.won
                  ? 'bg-white scale-125'
                  : result
                    ? 'bg-red-400/30'
                    : 'bg-white/10',
              )}
            />

            {/* COINFLIP */}
            {gameId === 'coinflip' && (
              <CoinFlipVisual
                key={animationKey}
                busy={busy}
                result={result}
              />
            )}

            {/* ROULETTE */}
            {gameId === 'roulette' && (
              <RouletteVisual
                key={animationKey}
                busy={busy}
                result={result}
              />
            )}

            {/* BLACKJACK */}
            {gameId === 'blackjack' && (
              <BlackjackVisual
                key={animationKey}
                busy={busy}
                result={result}
              />
            )}

            {/* CRASH */}
            {gameId === 'crash' && (
              <CrashVisual
                key={animationKey}
                busy={busy}
                result={result}
              />
            )}

            {/* MINES */}
            {gameId === 'mines' && (
              <div className="relative z-10">
                <div className="grid grid-cols-5 gap-2 mb-8">
                  {Array.from({ length: 25 }, (_, i) => {
                    const revealed = result?.cell === i;

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (!busy) setCell(i);
                        }}
                        className={cn(
                          'mine-tile w-12 h-12 sm:w-14 sm:h-14 rounded-xl glass',
                          'text-ink-400 font-bold',
                          'transition-all duration-200',
                          'hover:bg-white/10 hover:-translate-y-0.5',
                          cell === i &&
                            !result &&
                            'mine-selected',
                          revealed &&
                            (result?.won
                              ? 'mine-safe'
                              : 'mine-hit'),
                        )}
                      >
                        {revealed
                          ? result?.won
                            ? '◆'
                            : '✕'
                          : cell === i
                            ? '◆'
                            : '•'}
                      </button>
                    );
                  })}
                </div>

                {busy && (
                  <div className="text-center text-xs font-mono text-ink-400 animate-pulse">
                    REVEALING TILE...
                  </div>
                )}
              </div>
            )}

            {/* RESULT */}
            {showResult && result && (
              <div
                className={cn(
                  'relative z-20 mt-4 px-5 py-2.5 rounded-full',
                  'text-xs font-mono uppercase tracking-wider',
                  'result-reveal',
                  result.won
                    ? 'bg-white text-black'
                    : 'glass text-ink-200',
                )}
              >
                {result.won
                  ? `WIN · ${Number(result.multiplier ?? 1).toFixed(2)}x`
                  : 'LOSS'}

                {detail && ` · ${detail}`}
              </div>
            )}

            {/* PLAYING INDICATOR */}
            {busy && !result && (
              <div className="absolute bottom-2 flex items-center gap-2 text-xs font-mono text-ink-400">
                <span className="live-dot" />
                ROUND IN PROGRESS
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-ink-400">
            <Shield className="w-4 h-4" />
            Server-settled round · Balance and bet are recorded atomically
          </div>
        </Card>

        {/* SETTINGS */}
        <Card className="p-6">
          <h3 className="font-bold text-white mb-5">
            Bet Settings
          </h3>

          <label className="block mb-5">
            <span className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-2 block">
              Bet Amount
            </span>

            <div className="flex items-center gap-3 glass rounded-xl px-4 py-3">
              <span className="text-xs text-ink-300">$</span>

              <input
                type="number"
                min="0.10"
                step="0.10"
                value={bet}
                onChange={(e) =>
                  setBet(
                    Math.max(
                      0.1,
                      Number(e.target.value) || 0.1,
                    ),
                  )
                }
                className="w-full bg-transparent text-white outline-none font-mono"
              />
            </div>
          </label>

          {/* COINFLIP SETTINGS */}
          {gameId === 'coinflip' && (
            <div className="grid grid-cols-2 gap-2 mb-5">
              {['heads', 'tails'].map((value) => (
                <button
                  key={value}
                  onClick={() => setChoice(value)}
                  className={cn(
                    'py-3 rounded-xl uppercase text-xs font-mono',
                    'transition-all duration-200',
                    choice === value
                      ? 'bg-white text-black shadow-lg'
                      : 'glass text-ink-200 hover:bg-white/10',
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          )}

          {/* ROULETTE SETTINGS */}
          {gameId === 'roulette' && (
            <div className="mb-5">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {['red', 'black', '0'].map((value) => (
                  <button
                    key={value}
                    onClick={() => setChoice(value)}
                    className={cn(
                      'py-3 rounded-xl uppercase text-xs font-mono',
                      'transition-all duration-200',
                      choice === value
                        ? 'bg-white text-black'
                        : 'glass text-ink-200 hover:bg-white/10',
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>

              <select
                value={choice}
                onChange={(e) => setChoice(e.target.value)}
                className="w-full glass rounded-xl px-4 py-3 bg-transparent text-white"
              >
                <option value="red">Red</option>
                <option value="black">Black</option>

                {Array.from({ length: 37 }, (_, i) => (
                  <option key={i} value={String(i)}>
                    Number {i}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* CRASH SETTINGS */}
          {gameId === 'crash' && (
            <label className="block mb-5">
              <span className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-2 block">
                Auto Cashout
              </span>

              <input
                type="number"
                min="1.2"
                max="50"
                step="0.1"
                value={choice}
                onChange={(e) =>
                  setChoice(e.target.value)
                }
                className="w-full glass rounded-xl px-4 py-3 bg-transparent text-white outline-none"
              />
            </label>
          )}

          {/* MINES SETTINGS */}
          {gameId === 'mines' && (
            <label className="block mb-5">
              <span className="text-xs font-mono uppercase tracking-wider text-ink-300 mb-2 block">
                Mines
              </span>

              <input
                type="range"
                min="1"
                max="24"
                value={mineCount}
                onChange={(e) =>
                  setMineCount(Number(e.target.value))
                }
                className="w-full"
              />

              <div className="text-center text-white mt-2">
                {mineCount} mines
              </div>
            </label>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            <Stat
              label="Balance"
              value={formatUSD(user?.balance ?? 0)}
            />

            <Stat
              label="Max Bet"
              value={formatUSD(game.maxBet)}
            />
          </div>

          <Button
            onClick={() => play()}
            disabled={
              busy ||
              !user ||
              (user?.balance ?? 0) < bet
            }
            className="w-full"
            size="lg"
          >
            {busy ? (
              <RotateCcw className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}

            {busy
              ? 'PLAYING...'
              : gameId === 'mines'
                ? 'REVEAL TILE'
                : 'PLAY ROUND'}
          </Button>

          {!user && (
            <p className="text-xs text-ink-400 text-center mt-3">
              Sign up to play with your balance.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* COINFLIP                                                                    */
/* -------------------------------------------------------------------------- */

function CoinFlipVisual({
  busy,
  result,
}: {
  busy: boolean;
  result: CasinoResult | null;
}) {
  return (
    <div className="relative z-10 flex flex-col items-center">
      <div
        className={cn(
          'coin-scene',
          busy && 'coin-playing',
          result && !busy && 'coin-finished',
        )}
      >
        <div className="coin">
          <div className="coin-face coin-heads">
            <span>O</span>
          </div>

          <div className="coin-face coin-tails">
            <span>O</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="text-xs font-mono uppercase tracking-[0.3em] text-ink-500 mb-2">
          {busy
            ? 'FLIPPING'
            : result?.side
              ? result.side
              : 'CHOOSE SIDE'}
        </div>

        {busy && (
          <div className="flex justify-center gap-1">
            <span className="loading-bar" />
            <span className="loading-bar delay-1" />
            <span className="loading-bar delay-2" />
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ROULETTE                                                                    */
/* -------------------------------------------------------------------------- */

function RouletteVisual({
  busy,
  result,
}: {
  busy: boolean;
  result: CasinoResult | null;
}) {
  const rouletteNumbers = Array.from(
    { length: 37 },
    (_, i) => i,
  );

  return (
    <div className="relative z-10 flex flex-col items-center">
      <div
        className={cn(
          'roulette-stage',
          busy && 'roulette-playing',
        )}
      >
        <div className="roulette-pointer" />

        <div className="roulette-wheel">
          <div className="roulette-ring">
            {rouletteNumbers.map((number) => {
              const angle = (number / 37) * 360;

              return (
                <span
                  key={number}
                  className="roulette-number"
                  style={{
                    transform: `rotate(${angle}deg) translateY(-125px) rotate(-${angle}deg)`,
                  }}
                >
                  {number}
                </span>
              );
            })}
          </div>

          <div className="roulette-center">
            {busy ? (
              <Disc3 className="w-8 h-8 animate-spin" />
            ) : (
              <span>
                {result?.number ?? '?'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-7 text-xs font-mono uppercase tracking-[0.3em] text-ink-500">
        {busy
          ? 'SPINNING'
          : result
            ? `RESULT ${result.number}`
            : 'PLACE YOUR BET'}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* BLACKJACK                                                                   */
/* -------------------------------------------------------------------------- */

function BlackjackVisual({
  busy,
  result,
}: {
  busy: boolean;
  result: CasinoResult | null;
}) {
  const playerTotal = result?.player_total;
  const dealerTotal = result?.dealer_total;

  return (
    <div className="relative z-10 w-full max-w-xl">
      <div className="blackjack-table">
        <div className="blackjack-glow" />

        <div className="blackjack-label">
          DEALER
        </div>

        <div className="card-row dealer-row">
          <PlayingCard
            index={0}
            hidden={busy || !result}
          />

          <PlayingCard
            index={1}
            hidden={busy || !result}
            delay={120}
          />
        </div>

        <div className="blackjack-divider" />

        <div className="blackjack-label">
          PLAYER
        </div>

        <div className="card-row">
          <PlayingCard
            index={2}
            hidden={busy || !result}
            delay={240}
          />

          <PlayingCard
            index={3}
            hidden={busy || !result}
            delay={360}
          />

          <PlayingCard
            index={4}
            hidden={busy || !result}
            delay={480}
          />
        </div>

        <div className="blackjack-total">
          {busy
            ? '...'
            : playerTotal ?? '??'}
        </div>

        {!busy && dealerTotal !== undefined && (
          <div className="dealer-total">
            Dealer {dealerTotal}
          </div>
        )}
      </div>
    </div>
  );
}

function PlayingCard({
  index,
  hidden,
  delay = 0,
}: {
  index: number;
  hidden: boolean;
  delay?: number;
}) {
  return (
    <div
      className={cn(
        'playing-card',
        hidden
          ? 'playing-card-hidden'
          : 'playing-card-visible',
      )}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="playing-card-inner">
        <div className="playing-card-back">
          <span>O</span>
        </div>

        <div className="playing-card-front">
          <span>
            {['A', 'K', 'Q', 'J', '10'][index % 5]}
          </span>

          <small>
            {index % 2 === 0 ? '♠' : '♥'}
          </small>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CRASH                                                                       */
/* -------------------------------------------------------------------------- */

function CrashVisual({
  busy,
  result,
}: {
  busy: boolean;
  result: CasinoResult | null;
}) {
  return (
    <div className="relative z-10 flex flex-col items-center w-full">
      <div
        className={cn(
          'crash-graph',
          busy && 'crash-playing',
          result && !busy && 'crash-finished',
        )}
      >
        <div className="crash-grid" />

        <svg
          className="crash-line"
          viewBox="0 0 500 250"
          preserveAspectRatio="none"
        >
          <path
            d="M0 235 C70 230 85 210 135 205 C190 195 190 170 245 170 C305 165 285 120 350 120 C405 115 405 70 500 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
          />
        </svg>

        <Rocket className="crash-rocket w-8 h-8" />

        <div className="crash-multiplier">
          {busy
            ? '1.00x'
            : result?.crash
              ? `${Number(result.crash).toFixed(2)}x`
              : '1.00x'}
        </div>
      </div>

      <div className="mt-6 text-xs font-mono uppercase tracking-[0.3em] text-ink-500">
        {busy ? 'ROUND RUNNING' : 'CRASH'}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SHARED                                                                      */
/* -------------------------------------------------------------------------- */

function GameIcon({
  gameId,
}: {
  gameId: Exclude<GameId, 'dice'>;
}) {
  const props = {
    className: 'w-7 h-7 text-white',
  };

  if (gameId === 'crash') return <Rocket {...props} />;
  if (gameId === 'roulette') return <Disc3 {...props} />;
  if (gameId === 'blackjack') return <Spade {...props} />;
  if (gameId === 'coinflip') return <Coins {...props} />;

  return <Bomb {...props} />;
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider font-mono text-ink-400 mb-1">
        {label}
      </div>

      <div className="text-sm font-bold text-white">
        {value}
      </div>
    </div>
  );
}
