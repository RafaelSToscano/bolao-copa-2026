import { NextRequest, NextResponse } from "next/server";
import { withCache } from "@/lib/server/memoryCache";
import { cachePublic } from "@/lib/server/cacheHeaders";
import { gamesService } from "@/services/supabase/gamesService";
import { predictionsService } from "@/services/supabase/predictionsService";
import { projectRecent } from "@/services/dashboard/dashboardProjections";

const TTL_SECONDS = 30;
const SWR_SECONDS = 120;
const MAX_AGE = 15;

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
      const [games, userPredictions] = await Promise.all([
        gamesService.getAllGames(),
        userId
          ? predictionsService.getPredictionsForPlayer(userId)
          : Promise.resolve([]),
      ]);
      return projectRecent(games, userPredictions, userId, 5);
    }
  );

  return NextResponse.json(payload, {
    headers: cachePublic(TTL_SECONDS, SWR_SECONDS, MAX_AGE),
  });
}
