import { NextRequest, NextResponse } from "next/server";
import { withCache } from "@/lib/server/memoryCache";
import { cachePrivate, cachePublic } from "@/lib/server/cacheHeaders";
import { playersService } from "@/services/supabase/playersService";
import { gamesService } from "@/services/supabase/gamesService";
import { predictionsService } from "@/services/supabase/predictionsService";
import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";
import { projectRankingTop } from "@/services/dashboard/dashboardProjections";
import { getCachedLiveScores } from "@/lib/server/footballData";

const TTL_SECONDS = 8;
const SWR_SECONDS = 30;
const MAX_AGE = 4;
const UUID_OR_MOCK_ID = /^[a-zA-Z0-9-]{1,128}$/;

export async function GET(req: NextRequest) {
  const rawUserId = req.nextUrl.searchParams.get("userId");
  const userId =
    rawUserId && UUID_OR_MOCK_ID.test(rawUserId) ? rawUserId : null;

  const cacheKey = userId
    ? `dashboard:ranking-top:${userId}`
    : "dashboard:ranking-top";

  const payload = await withCache(cacheKey, TTL_SECONDS, async () => {
    const [
      players,
      games,
      predictions,
      liveScores,
      knockoutMatches,
      knockoutPredictions,
    ] = await Promise.all([
      playersService.getPublicPlayers(),
      gamesService.getAllGames(),
      predictionsService.getAllPredictions(),
      getCachedLiveScores(),
      knockoutPredictionsService.getKnockoutMatches(),
      knockoutPredictionsService.getAllKnockoutPredictions(),
    ]);

    const rankingPlayers = players.filter(
      (player) => player.ranking_visible !== false
    );

    return projectRankingTop(
      rankingPlayers,
      games,
      predictions,
      10,
      liveScores,
      knockoutMatches,
      knockoutPredictions,
      userId
    );
  });

  return NextResponse.json(payload, {
    headers: userId
      ? cachePrivate(TTL_SECONDS)
      : cachePublic(TTL_SECONDS, SWR_SECONDS, MAX_AGE),
  });
}