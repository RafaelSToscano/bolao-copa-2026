"use client";

import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { MatchCard } from "@/components/ui/MatchCard";
import { getLiveGames, getNextGames } from "@/lib/liveGames";

interface NextGameBannerProps {
  games: Game[];
  predictions: Prediction[];
  currentUserId: string;
}

export function NextGameBanner({
  games,
  predictions,
  currentUserId,
}: NextGameBannerProps) {
  // Hide while a live game is in progress — LiveGameBanner takes that
  // slot and the prediction card would just compete for attention.
  if (getLiveGames(games).length > 0) return null;

  const nextGames = getNextGames(games, 2);
  if (nextGames.length === 0) return null;

  const label =
    nextGames.length === 1 ? "Próximo Jogo" : "Próximos Jogos";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-blue-400 uppercase tracking-widest">
          ⏭️ {label}
        </span>
      </div>

      <div
        className={
          nextGames.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : ""
        }
      >
        {nextGames.map((game) => {
          const prediction = predictions.find(
            (p) => p.player_id === currentUserId && p.game_id === game.id
          );

          return (
            <MatchCard
              key={game.id}
              game={game}
              prediction={prediction}
              mode="prediction"
            />
          );
        })}
      </div>
    </div>
  );
}
