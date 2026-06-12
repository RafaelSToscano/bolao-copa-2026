import { NextRequest, NextResponse } from "next/server";
import { withCache } from "@/lib/server/memoryCache";
import { cachePrivate } from "@/lib/server/cacheHeaders";
import { playersService } from "@/services/supabase/playersService";
import { gamesService } from "@/services/supabase/gamesService";
import { predictionsService } from "@/services/supabase/predictionsService";
import { projectMyStatus } from "@/services/dashboard/dashboardProjections";
import { getCachedLiveScores } from "@/lib/server/footballData";

const TTL_SECONDS = 8;
const UUID_OR_MOCK_ID = /^[a-zA-Z0-9-]{1,128}$/;

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { error: "userId required" },
      { status: 400 }
    );
  }
  if (!UUID_OR_MOCK_ID.test(userId)) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  const payload = await withCache(
    `dashboard:my-status:${userId}`,
    TTL_SECONDS,
    async () => {
      const [players, games, predictions, liveScores] = await Promise.all([
        playersService.getAllPlayers(),
        gamesService.getAllGames(),
        predictionsService.getAllPredictions(),
        getCachedLiveScores(),
      ]);
      return projectMyStatus(userId, players, games, predictions, liveScores);
    }
  );

  return NextResponse.json(payload, {
    headers: cachePrivate(TTL_SECONDS),
  });
}
