import { NextResponse } from "next/server";
import { withCache } from "@/lib/server/memoryCache";
import { cachePublic } from "@/lib/server/cacheHeaders";
import { gamesService } from "@/services/supabase/gamesService";
import { projectLive } from "@/services/dashboard/dashboardProjections";

const TTL_SECONDS = 8;
const SWR_SECONDS = 20;
const MAX_AGE = 5;

/**
 * Returns which games are currently in the live window plus the
 * countdown to the next kickoff. Live SCORES are NOT included here —
 * the client reads those from `/api/live-scores` (single source of
 * truth) so dashboard, palpites banner, and goal-detection all share
 * one cache window and one shape.
 */
export async function GET() {
  const payload = await withCache(
    "dashboard:live",
    TTL_SECONDS,
    async () => {
      const games = await gamesService.getAllGames();
      return projectLive(games);
    }
  );

  return NextResponse.json(payload, {
    headers: cachePublic(TTL_SECONDS, SWR_SECONDS, MAX_AGE),
  });
}
