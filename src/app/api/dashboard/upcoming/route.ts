import { NextResponse } from "next/server";
import { withCache } from "@/lib/server/memoryCache";
import { cachePublic } from "@/lib/server/cacheHeaders";
import { getDashboardRankingBaseData } from "@/services/dashboard/dashboardBaseData";
import { projectUpcoming } from "@/services/dashboard/dashboardProjections";
import { isKnockoutMatchPredictionLocked, isPredictableKnockoutRound } from "@/config/knockout";
import { Game } from "@/types/game";

// 3h TTL. Under a projection cache miss we still read exclusively
// from the shared 3h base-data cache — no direct Supabase query
// fires from this route unless the base cache itself is missing.
const TTL_SECONDS = 10800;
const SWR_SECONDS = 10800;
const MAX_AGE = 600;

export async function GET() {
  const payload = await withCache(
    "dashboard:upcoming",
    TTL_SECONDS,
    async () => {
      const base = await getDashboardRankingBaseData();
      const knockoutGames: Game[] = base.knockoutMatches
        .filter(
          (match) =>
            isPredictableKnockoutRound(match.round) &&
            Boolean(match.home_team && match.away_team)
        )
        .map((match) => ({
          id: `knockout-${match.id}`,
          phase: "knockout",
          group_name: "Mata-mata",
          match_order: match.match_number,
          match_date: match.match_date,
          team_a: match.home_team!,
          team_b: match.away_team!,
          official_score_a: match.official_score_home,
          official_score_b: match.official_score_away,
          locked: isKnockoutMatchPredictionLocked(match),
        }));

      return projectUpcoming([...base.games, ...knockoutGames], 5);
    }
  );

  return NextResponse.json(payload, {
    headers: cachePublic(TTL_SECONDS, SWR_SECONDS, MAX_AGE),
  });
}
