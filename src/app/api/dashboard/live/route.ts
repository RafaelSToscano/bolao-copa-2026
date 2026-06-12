import { NextResponse } from "next/server";
import { withCache } from "@/lib/server/memoryCache";
import { cachePublic } from "@/lib/server/cacheHeaders";
import { gamesService } from "@/services/supabase/gamesService";
import { projectLive } from "@/services/dashboard/dashboardProjections";
import { getCachedLiveScores } from "@/lib/server/footballData";

const TTL_SECONDS = 8;
const SWR_SECONDS = 20;
const MAX_AGE = 5;

export async function GET() {
  const payload = await withCache(
    "dashboard:live",
    TTL_SECONDS,
    async () => {
      const [games, liveScores] = await Promise.all([
        gamesService.getAllGames(),
        getCachedLiveScores(),
      ]);
      return projectLive(games, liveScores);
    }
  );

  return NextResponse.json(payload, {
    headers: cachePublic(TTL_SECONDS, SWR_SECONDS, MAX_AGE),
  });
}
