import { NextResponse } from "next/server";
import { withCache } from "@/lib/server/memoryCache";
import { cachePublic } from "@/lib/server/cacheHeaders";
import { gamesService } from "@/services/supabase/gamesService";
import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";
import { projectUpcoming } from "@/services/dashboard/dashboardProjections";
import { isKnockoutMatchPredictionLocked, isPredictableKnockoutRound } from "@/config/knockout";
import { Game } from "@/types/game";

const TTL_SECONDS = 120;
const SWR_SECONDS = 600;
const MAX_AGE = 60;

export async function GET() {
  const payload = await withCache(
    "dashboard:upcoming",
    TTL_SECONDS,
    async () => {
      const [games, knockoutMatches] = await Promise.all([
        gamesService.getAllGames(),
        knockoutPredictionsService.getKnockoutMatches(),
      ]);
      const knockoutGames: Game[] = knockoutMatches
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

      return projectUpcoming([...games, ...knockoutGames], 5);
    }
  );

  return NextResponse.json(payload, {
    headers: cachePublic(TTL_SECONDS, SWR_SECONDS, MAX_AGE),
  });
}
