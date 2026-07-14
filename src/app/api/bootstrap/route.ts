import { NextRequest, NextResponse } from "next/server";
import { withCache } from "@/lib/server/memoryCache";
import { getDashboardRankingBaseData } from "@/services/dashboard/dashboardBaseData";

const UUID_OR_MOCK_ID = /^[a-zA-Z0-9-]{1,128}$/;

// 3h TTL on the SERVER-side memory cache only. Every write path
// (admin or player) hits /api/dashboard/cache/evict, which drops
// the matching `dashboard:bootstrap:*` keys.
//
// Response Cache-Control is `no-store`: browsers must never keep this
// payload in the HTTP cache. Otherwise a same-tab refresh after a
// user save would replay a pre-save response for up to max-age
// seconds, and no amount of server-side eviction can reach it.
const TTL_SECONDS = 10800;

/**
 * Server-cached snapshot of the top-level app data used by useData.
 *
 * `all=1` returns everyone's predictions; otherwise only the caller's
 * predictions are returned. The tournament result is included in both
 * variants so the client never needs a second direct Supabase request.
 */
export async function GET(req: NextRequest) {
  const rawUserId = req.nextUrl.searchParams.get("userId");
  const userId =
    rawUserId && UUID_OR_MOCK_ID.test(rawUserId) ? rawUserId : null;
  const all = req.nextUrl.searchParams.get("all") === "1";

  if (rawUserId && !userId) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  const cacheKey = all
    ? "dashboard:bootstrap:all"
    : `dashboard:bootstrap:own:${userId ?? "anon"}`;

  const payload = await withCache(cacheKey, TTL_SECONDS, async () => {
    const base = await getDashboardRankingBaseData();

    if (all) {
      return {
        players: base.players,
        games: base.games,
        predictions: base.predictions,
        knockoutMatches: base.knockoutMatches,
        knockoutPredictions: base.knockoutPredictions,
        finalPredictions: base.finalPredictions,
        tournamentResult: base.tournamentResult,
      };
    }

    const ownPredictions = userId
      ? base.predictions.filter((prediction) => prediction.player_id === userId)
      : [];
    const ownKnockoutPredictions = userId
      ? base.knockoutPredictions.filter(
          (prediction) => prediction.player_id === userId
        )
      : [];

    return {
      players: base.players,
      games: base.games,
      predictions: ownPredictions,
      knockoutMatches: base.knockoutMatches,
      knockoutPredictions: ownKnockoutPredictions,
      finalPredictions: base.finalPredictions,
      tournamentResult: base.tournamentResult,
    };
  });

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
