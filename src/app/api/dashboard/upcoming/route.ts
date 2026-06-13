import { NextResponse } from "next/server";
import { withCache } from "@/lib/server/memoryCache";
import { cachePublic } from "@/lib/server/cacheHeaders";
import { gamesService } from "@/services/supabase/gamesService";
import { projectUpcoming } from "@/services/dashboard/dashboardProjections";

const TTL_SECONDS = 120;
const SWR_SECONDS = 600;
const MAX_AGE = 60;

export async function GET() {
  const payload = await withCache(
    "dashboard:upcoming",
    TTL_SECONDS,
    async () => {
      const games = await gamesService.getAllGames();
      return projectUpcoming(games, 2);
    }
  );

  return NextResponse.json(payload, {
    headers: cachePublic(TTL_SECONDS, SWR_SECONDS, MAX_AGE),
  });
}
