import { withCache } from "@/lib/server/memoryCache";
import { playersService } from "@/services/supabase/playersService";
import { gamesService } from "@/services/supabase/gamesService";
import { predictionsService } from "@/services/supabase/predictionsService";
import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";
import {
  finalPredictionsService,
  FinalPrediction,
} from "@/services/supabase/finalPredictionsService";
import {
  tournamentResultService,
  TournamentResult,
} from "@/services/supabase/tournamentResultService";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";

// 3-hour TTL. Nothing in this snapshot changes without an admin
// action, and every admin write path calls
// /api/dashboard/cache/evict (evictByPrefix "dashboard:") which drops
// this key immediately. The projection endpoints, the ranking
// recompute for live matches, and the /api/bootstrap payload all
// share this cache — during a normal live match window the DB is
// touched exactly once, then every subsequent viewer hits memory.
const DASHBOARD_RANKING_BASE_TTL_SECONDS = 10800;

// Final predictions (podium picks) are locked before the tournament
// and never change during gameplay. Same 3h ceiling; the evict
// endpoint clears this key too on admin writes.
const FINAL_PREDICTIONS_TTL_SECONDS = 10800;
const TOURNAMENT_RESULT_TTL_SECONDS = 10800;

export type DashboardRankingBaseData = {
  players: Player[];
  games: Game[];
  predictions: Prediction[];
  knockoutMatches: KnockoutMatchRecord[];
  knockoutPredictions: KnockoutPrediction[];
  finalPredictions: FinalPrediction[];
  tournamentResult: TournamentResult | null;
};

export async function getDashboardRankingBaseData(): Promise<DashboardRankingBaseData> {
  const [baseData, finalPredictions, tournamentResult] = await Promise.all([
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

        return {
          players,
          games,
          predictions,
          knockoutMatches,
          knockoutPredictions,
        };
      }
    ),
    withCache(
      "dashboard:final-predictions",
      FINAL_PREDICTIONS_TTL_SECONDS,
      () => finalPredictionsService.getAll()
    ),
    withCache(
      "dashboard:tournament-result",
      TOURNAMENT_RESULT_TTL_SECONDS,
      async () => {
        try {
          return await tournamentResultService.get();
        } catch (error) {
          // Ranking, próximos jogos and standings must remain available even
          // if this optional bonus-result read fails. The admin save path does
          // not use this fallback and will still surface write/read errors.
          if (process.env.NODE_ENV !== "test") {
            console.error("Failed to load tournament result:", error);
          }
          return null;
        }
      }
    ),
  ]);

  return { ...baseData, finalPredictions, tournamentResult };
}
