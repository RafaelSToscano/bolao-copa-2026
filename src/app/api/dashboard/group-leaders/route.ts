import { NextResponse } from "next/server";
import { withCache } from "@/lib/server/memoryCache";
import { cachePublic } from "@/lib/server/cacheHeaders";
import { gamesService } from "@/services/supabase/gamesService";
import { projectGroupLeaders } from "@/services/dashboard/dashboardProjections";

const TTL_SECONDS = 60;
const SWR_SECONDS = 300;
const MAX_AGE = 30;

export async function GET() {
  const payload = await withCache(
    "dashboard:group-leaders",
    TTL_SECONDS,
    async () => {
      const games = await gamesService.getAllGames();
      return projectGroupLeaders(games);
    }
  );

  return NextResponse.json(payload, {
    headers: cachePublic(TTL_SECONDS, SWR_SECONDS, MAX_AGE),
  });
}
