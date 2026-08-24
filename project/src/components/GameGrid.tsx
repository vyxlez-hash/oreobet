import { useState } from 'react';
import * as Icons from 'lucide-react';
import { games } from '../data';
import { useApp } from '../store';
import { Card, Button, Badge } from '../ui';
import { cn, formatNumber, formatUSD } from '../utils';
import type { Game } from '../types';

export function GameGrid({ limit }: { limit?: number }) {
  const { navigate, user, openAuth } = useApp();
  const [hovered, setHovered] = useState<string | null>(null);
  const displayGames = limit ? games.slice(0, limit) : games;

  const handlePlay = (game: Game) => {
    if (!user) {
      openAuth('signup');
      return;
    }
    navigate(`play-${game.id}` as never);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {displayGames.map((game) => {
        const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[game.icon] || Icons.Gamepad2;
        return (
          <Card
            key={game.id}
            hover
            className={cn(
              'group relative overflow-hidden p-6 cursor-pointer animate-fade-in-up',
              hovered === game.id && 'scale-[1.02]'
            )}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.06), transparent 70%)',
              }}
            />
            <div
              className="relative z-10"
              onMouseEnter={() => setHovered(game.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center transition-all duration-500 group-hover:rotate-6 group-hover:scale-110">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <Badge>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {formatNumber(game.players)} playing
                </Badge>
              </div>

              <h3 className="text-2xl font-bold text-white mb-1">{game.name}</h3>
              <p className="text-sm text-ink-300 mb-6">{game.description}</p>

              <div className="flex items-center justify-between mb-5 text-xs font-mono">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-ink-300">Edge</span>
                    <span className="text-white ml-1.5">{game.edge}%</span>
                  </div>
                  <div>
                    <span className="text-ink-300">Min</span>
                    <span className="text-white ml-1.5">{formatUSD(game.minBet)}</span>
                  </div>
                </div>
              </div>

              <Button className="w-full group/btn" onClick={() => handlePlay(game)}>
                <Icons.Play className="w-4 h-4 transition-transform group-hover/btn:scale-125" />
                PLAY
              </Button>
            </div>

            <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-700 group-hover:via-white/60" />
          </Card>
        );
      })}
    </div>
  );
}
