import { Game } from "@/types/game";
import { KnockoutMatchRecord } from "@/types/knockout";
import { generateRound32 } from "@/services/standings/knockoutQualification";

export type DisplayKnockoutMatch = KnockoutMatchRecord & {
  display_home_team: string | null;
  display_away_team: string | null;
};

export function buildDisplayKnockoutMatches(
  matches: KnockoutMatchRecord[],
  games: Game[]
): DisplayKnockoutMatch[] {
  const simulatedRound32 = generateRound32(games);

  return matches.map((match) => {
    if (match.round !== "r32") {
      return {
        ...match,
        display_home_team: match.home_team,
        display_away_team: match.away_team,
      };
    }

    const simulated = simulatedRound32[match.match_number - 1];

    return {
      ...match,
      display_home_team: match.home_team ?? simulated?.home?.team ?? null,
      display_away_team: match.away_team ?? simulated?.away?.team ?? null,
    };
  });
}