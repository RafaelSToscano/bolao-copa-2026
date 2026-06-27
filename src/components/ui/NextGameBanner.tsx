"use client";

import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { MatchCard } from "@/components/ui/MatchCard";
import { getNextMatchDayGames } from "@/lib/liveGames";

interface NextGameBannerProps {
  games: Game[];
  predictions: Prediction[];
  currentUserId: string;
  limit?: number;
}

/**
 * Renders games from the next match day (the soonest UTC calendar
 * date that still has at least one not-yet-finished, future fixture).
 * The dashboard's hero slot defaults to 2 cards; /palpites passes
 * `limit={Infinity}` to show every match scheduled for that day.
 */
export function NextGameBanner({
  games,
  predictions,
  currentUserId,
  limit = 2,
}: NextGameBannerProps) {
  const nextGames = getNextMatchDayGames(games, limit);
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
