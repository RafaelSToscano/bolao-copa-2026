import { withCache } from "@/lib/server/memoryCache";
import { playersService } from "@/services/supabase/playersService";
import { gamesService } from "@/services/supabase/gamesService";
import { predictionsService } from "@/services/supabase/predictionsService";
import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";
import { finalPredictionsService, FinalPrediction } from "@/services/supabase/finalPredictionsService";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";

// During a live game none of this data changes — predictions are locked,
// players and schedule are fixed. Only live scores (separate cache, 8s)
// actually move. 60s here cuts ~87% of Supabase calls during peak load.
const DASHBOARD_RANKING_BASE_TTL_SECONDS = 60;

// Final predictions (podium picks) are locked before the tournament
// and never change during gameplay. Cache them independently with a
// longer TTL so they don't pollute the base-data invalidation cycle.
const FINAL_PREDICTIONS_TTL_SECONDS = 300;

export type DashboardRankingBaseData = {
  players: Player[];
  games: Game[];
  predictions: Prediction[];
  knockoutMatches: KnockoutMatchRecord[];
  knockoutPredictions: KnockoutPrediction[];
  finalPredictions: FinalPrediction[];
};

export async function getDashboardRankingBaseData(): Promise<DashboardRankingBaseData> {
  const [baseData, finalPredictions] = await Promise.all([
    withCache(
      "dashboard:ranking-base-data",
      DASHBOARD_RANKING_BASE_TTL_SECONDS,
      async () => {
        const [
          players,
          games,
          predictions,
          knockoutMatches,
          knockoutPredictions,
        ] = await Promise.all([
          playersService.getPublicPlayers(),
          gamesService.getAllGames(),
          predictionsService.getAllPredictions(),
          knockoutPredictionsService.getKnockoutMatches(),
          knockoutPredictionsService.getAllKnockoutPredictions(),
        ]);

        return { players, games, predictions, knockoutMatches, knockoutPredictions };
      }
    ),
    withCache(
      "dashboard:final-predictions",
      FINAL_PREDICTIONS_TTL_SECONDS,
      () => finalPredictionsService.getAll()
    ),
  ]);

  return { ...baseData, finalPredictions };
}
