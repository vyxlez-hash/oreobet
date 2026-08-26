import { ArrowLeft, Play, Construction, Shield } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useApp } from '../../store';
import { Button, Card, Badge } from '../../ui';
import { games } from '../../data';
import { formatUSD } from '../../utils';
import type { GameId } from '../../types';

export function GameComingSoon({ gameId }: { gameId: GameId }) {
  const { navigate, openAuth, user } = useApp();
  const game = games.find((g) => g.id === gameId)!;
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[game.icon] || Icons.Gamepad2;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <button onClick={() => navigate('games')} className="inline-flex items-center gap-2 text-ink-300 hover:text-white transition-colors mb-8 text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to Games
      </button>

      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{game.name}</h1>
          <p className="text-ink-300 text-sm">{game.description}</p>
        </div>
      </div>

      <Card className="p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.06), transparent 60%)' }} />

        <div className="relative z-10">
          <div className="w-20 h-20 rounded-3xl glass flex items-center justify-center mx-auto mb-6 animate-float-slow">
            <Construction className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Coming Soon</h2>
          <p className="text-ink-200 max-w-md mx-auto mb-8">
            The {game.name} game is being crafted with the same provably fair engine as Dice. In this demo prototype, only Dice is fully playable.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('play-dice')}>
              <Play className="w-4 h-4" />
              Play Dice Instead
            </Button>
            {!user && (
              <Button variant="outline" onClick={() => openAuth('signup')}>
                Create Demo Account
              </Button>
            )}
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Badge>
              <Shield className="w-3.5 h-3.5" />
              Provably Fair Ready
            </Badge>
            <Badge>
              {game.edge}% House Edge
            </Badge>
            <Badge>
              Max Bet: {formatUSD(game.maxBet)}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
