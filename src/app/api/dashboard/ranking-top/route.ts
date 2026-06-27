import { NextResponse } from "next/server";
import { withCache } from "@/lib/server/memoryCache";
import { cachePublic } from "@/lib/server/cacheHeaders";
import { playersService } from "@/services/supabase/playersService";
import { gamesService } from "@/services/supabase/gamesService";
import { predictionsService } from "@/services/supabase/predictionsService";
import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";
import { projectRankingTop } from "@/services/dashboard/dashboardProjections";
import { getCachedLiveScores } from "@/lib/server/footballData";

const TTL_SECONDS = 8;
const SWR_SECONDS = 30;
const MAX_AGE = 4;

export async function GET() {
  const payload = await withCache(
    "dashboard:ranking-top",
    TTL_SECONDS,
    async () => {
      const [
        players,
        games,
        predictions,
        liveScores,
        knockoutMatches,
        knockoutPredictions,
      ] = await Promise.all([
        playersService.getAllPlayers(),
        gamesService.getAllGames(),
        predictionsService.getAllPredictions(),
        getCachedLiveScores(),
        knockoutPredictionsService.getKnockoutMatches(),
        knockoutPredictionsService.getAllKnockoutPredictions(),
      ]);
      return projectRankingTop(
        players,
        games,
        predictions,
        10,
        liveScores,
        knockoutMatches,
        knockoutPredictions
      );
    }
  );

  return NextResponse.json(payload, {
    headers: cachePublic(TTL_SECONDS, SWR_SECONDS, MAX_AGE),
  });
}
