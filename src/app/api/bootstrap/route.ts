import { NextRequest, NextResponse } from "next/server";
import { withCache } from "@/lib/server/memoryCache";
import { cachePrivate, cachePublic } from "@/lib/server/cacheHeaders";
import { getDashboardRankingBaseData } from "@/services/dashboard/dashboardBaseData";

const UUID_OR_MOCK_ID = /^[a-zA-Z0-9-]{1,128}$/;

// 3h TTL. Every admin write path calls /api/dashboard/cache/evict,
// which evictByPrefix("dashboard:") — that clears this endpoint's
// projections AND the base-data cache underneath. Between admin
// writes, none of this data changes: predictions are locked, games
// and knockout brackets only mutate on admin action.
const TTL_SECONDS = 10800;
const SWR_SECONDS = 10800;
const MAX_AGE = 600;

/**
 * Server-cached snapshot of the top-level app data used by useData
 * (players, games, predictions, knockout_matches, knockout_predictions,
 * final_predictions).
 *
 * Every read this endpoint performs goes through the shared 3h
 * base-data cache, so a cache hit does zero DB work; a cache miss
 * performs the shared Supabase fanout that every other dashboard
 * endpoint reuses. Force-evicted on admin writes via /api/dashboard/
 * cache/evict.
 *
 * `all=1` returns everyone's predictions (needed by /ranking,
 * /simulador, /palpites-da-galera); otherwise only the caller's
 * predictions are returned. The admin `includePrivatePlayers` path
 * still hits Supabase directly from the client since access codes
 * must not be cached at the CDN.
 */
export async function GET(req: NextRequest) {
  const rawUserId = req.nextUrl.searchParams.get("userId");
  const userId =
    rawUserId && UUID_OR_MOCK_ID.test(rawUserId) ? rawUserId : null;
  const all = req.nextUrl.searchParams.get("all") === "1";

  if (rawUserId && !userId) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  // all=1 payload doesn't depend on userId — cache once for every
  // signed-in viewer instead of per-user. Own-predictions variant
  // stays keyed per player because it filters to the caller's rows.
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
      };
    }

    // Filter the caller's rows from the cached base data instead of
    // firing a second Supabase query.
    const ownPredictions = userId
      ? base.predictions.filter((p) => p.player_id === userId)
      : [];
    const ownKnockoutPredictions = userId
      ? base.knockoutPredictions.filter((p) => p.player_id === userId)
      : [];

    return {
      players: base.players,
      games: base.games,
      predictions: ownPredictions,
      knockoutMatches: base.knockoutMatches,
      knockoutPredictions: ownKnockoutPredictions,
      // Everyone's podium picks. They're one row per player, locked
      // pre-tournament — safe to ship in full to every viewer, and
      // consumers (PodiumVotesPanel, FinalPredictionsCard) already
      // filter client-side.
      finalPredictions: base.finalPredictions,
    };
  });

  return NextResponse.json(payload, {
    headers: all || !userId
      ? cachePublic(TTL_SECONDS, SWR_SECONDS, MAX_AGE)
      : cachePrivate(TTL_SECONDS),
  });
}
