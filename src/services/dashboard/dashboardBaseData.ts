import { withCache } from "@/lib/server/memoryCache";
import { playersService } from "@/services/supabase/playersService";
import { gamesService } from "@/services/supabase/gamesService";
import { predictionsService } from "@/services/supabase/predictionsService";
import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";

const DASHBOARD_RANKING_BASE_TTL_SECONDS = 8;

export type DashboardRankingBaseData = {
  players: Player[];
  games: Game[];
  predictions: Prediction[];
  knockoutMatches: KnockoutMatchRecord[];
  knockoutPredictions: KnockoutPrediction[];
};

export async function getDashboardRankingBaseData(): Promise<DashboardRankingBaseData> {
  return withCache(
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
  );
}
