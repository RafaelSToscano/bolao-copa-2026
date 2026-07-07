import { NextRequest, NextResponse } from "next/server";
import { withCache } from "@/lib/server/memoryCache";
import { cachePrivate, cachePublic } from "@/lib/server/cacheHeaders";
import { projectRankingTop } from "@/services/dashboard/dashboardProjections";
import { getDashboardRankingBaseData } from "@/services/dashboard/dashboardBaseData";
import { getCachedLiveScores } from "@/lib/server/footballData";

// Short projection TTL is fine — the DB reads live behind the 60-min
// base-data cache. Only the live-score overlay (also 8s cache, no DB)
// touches upstream on each miss.
const PRIVATE_TTL_SECONDS = 8;
const PUBLIC_TTL_SECONDS = 15;
const SWR_SECONDS = 60;
const MAX_AGE = 8;
const UUID_OR_MOCK_ID = /^[a-zA-Z0-9-]{1,128}$/;

export async function GET(req: NextRequest) {
  const rawUserId = req.nextUrl.searchParams.get("userId");
  const userId =
    rawUserId && UUID_OR_MOCK_ID.test(rawUserId) ? rawUserId : null;

  const cacheKey = userId
    ? `dashboard:ranking-top:${userId}`
    : "dashboard:ranking-top";
  const ttlSeconds = userId ? PRIVATE_TTL_SECONDS : PUBLIC_TTL_SECONDS;

  const payload = await withCache(cacheKey, ttlSeconds, async () => {
    const [baseData, liveScores] = await Promise.all([
      getDashboardRankingBaseData(),
      getCachedLiveScores(),
    ]);

    const rankingPlayers = baseData.players.filter(
      (player) => player.ranking_visible !== false
    );

    return projectRankingTop(
      rankingPlayers,
      baseData.games,
      baseData.predictions,
      10,
      liveScores,
      baseData.knockoutMatches,
      baseData.knockoutPredictions,
      userId
    );
  });

  return NextResponse.json(payload, {
    headers: userId
      ? cachePrivate(PRIVATE_TTL_SECONDS)
      : cachePublic(PUBLIC_TTL_SECONDS, SWR_SECONDS, MAX_AGE),
  });
}
