"use client";

import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutPrediction } from "@/types/knockout";
import { MatchCard } from "@/components/ui/MatchCard";
import { getNextMatchDayGames } from "@/lib/liveGames";

interface NextGameBannerProps {
  games: Game[];
  predictions: Prediction[];
  knockoutPredictions?: KnockoutPrediction[];
  currentUserId: string;
  limit?: number;
}

function getKnockoutMatchId(game: Game): number | null {
  const raw = String(game.id);

  if (raw.startsWith("knockout-")) {
    const id = Number(raw.replace("knockout-", ""));
    return Number.isFinite(id) ? id : null;
  }

  if (game.phase !== "groups" && game.match_order) {
    return Number(game.match_order);
  }

  return null;
}

function findPredictionForGame({
  game,
  currentUserId,
  predictions,
  knockoutPredictions,
}: {
  game: Game;
  currentUserId: string;
  predictions: Prediction[];
  knockoutPredictions: KnockoutPrediction[];
}): Prediction | undefined {
  const knockoutMatchId = getKnockoutMatchId(game);

  if (knockoutMatchId) {
    const knockoutPrediction = knockoutPredictions.find(
      (p) =>
        p.player_id === currentUserId &&
        p.match_id === knockoutMatchId
    );

    if (knockoutPrediction) {
      return {
        player_id: knockoutPrediction.player_id,
        game_id: game.id,
        predicted_score_a: knockoutPrediction.predicted_score_home,
        predicted_score_b: knockoutPrediction.predicted_score_away,
      };
    }
  }

  return predictions.find(
    (p) => p.player_id === currentUserId && p.game_id === game.id
  );
}

export function NextGameBanner({
  games,
  predictions,
  knockoutPredictions = [],
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
          const prediction = findPredictionForGame({
            game,
            currentUserId,
            predictions,
            knockoutPredictions,
          });

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