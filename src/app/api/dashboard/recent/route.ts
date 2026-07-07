import { NextRequest, NextResponse } from "next/server";
import { withCache } from "@/lib/server/memoryCache";
import { cachePublic } from "@/lib/server/cacheHeaders";
import { getDashboardRankingBaseData } from "@/services/dashboard/dashboardBaseData";
import { projectRecent } from "@/services/dashboard/dashboardProjections";

// 3h TTL: only admin-submitted official scores move this list. All
// underlying reads go through the shared 3h base-data cache — no
// direct Supabase query fires from this route under a cache miss.
const TTL_SECONDS = 10800;
const SWR_SECONDS = 10800;
const MAX_AGE = 600;

const UUID_OR_MOCK_ID = /^[a-zA-Z0-9-]{1,128}$/;

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (userId && !UUID_OR_MOCK_ID.test(userId)) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  const payload = await withCache(
    `dashboard:recent:${userId ?? "anon"}`,
    TTL_SECONDS,
    async () => {
      const base = await getDashboardRankingBaseData();

      // Filter the caller's rows from the cached base data instead of
      // firing a second per-user Supabase query.
      const userPredictions = userId
        ? base.predictions.filter((p) => p.player_id === userId)
        : [];
      const userKnockoutPredictions = userId
        ? base.knockoutPredictions.filter((p) => p.player_id === userId)
        : [];

      return projectRecent(
        base.games,
        userPredictions,
        userId,
        5,
        base.knockoutMatches,
        userKnockoutPredictions
      );
    }
  );

  return NextResponse.json(payload, {
    headers: cachePublic(TTL_SECONDS, SWR_SECONDS, MAX_AGE),
  });
}
