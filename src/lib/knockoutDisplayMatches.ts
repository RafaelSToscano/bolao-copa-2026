import { Game } from "@/types/game";
import { KnockoutMatchRecord } from "@/types/knockout";
import { generateRound32 } from "@/services/standings/knockoutQualification";

export type DisplayKnockoutMatch = KnockoutMatchRecord & {
  display_home_team: string | null;
  display_away_team: string | null;
};

const ROUND32_DATES_BR: Record<number, string> = {
  1: "2026-06-28T16:00:00-03:00",
  2: "2026-06-29T14:00:00-03:00",
  3: "2026-06-29T17:30:00-03:00",
  4: "2026-06-30T14:00:00-03:00",
  5: "2026-06-30T18:00:00-03:00",
  6: "2026-06-30T22:00:00-03:00",
  7: "2026-07-01T22:00:00-03:00",
  8: "2026-07-01T13:00:00-03:00",
  9: "2026-07-01T21:00:00-03:00",
  10: "2026-07-01T17:00:00-03:00",
  11: "2026-07-02T21:00:00-03:00",
  12: "2026-07-02T16:00:00-03:00",
  13: "2026-07-03T00:00:00-03:00",
  14: "2026-07-03T19:00:00-03:00",
  15: "2026-07-03T23:00:00-03:00",
  16: "2026-07-03T22:30:00-03:00",
};

function isGroupComplete(games: Game[], groupName: string): boolean {
  const groupGames = games.filter((game) => game.group_name === groupName);

  return (
    groupGames.length > 0 &&
    groupGames.every(
      (game) =>
        game.official_score_a !== null &&
        game.official_score_b !== null
    )
  );
}

function isSlotReady(slot: string, games: Game[]): boolean {
  const groupMatch = slot.match(/[A-L]/);
  const groupName = groupMatch?.[0];

  if (!groupName) return true;

  return isGroupComplete(games, groupName);
}

function getVisibleTeam(slot: string, team: string | null, games: Game[]) {
  if (!team) return null;
  return isSlotReady(slot, games) ? team : null;
}

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

    const homeCandidate = match.home_team ?? simulated?.home?.team ?? null;
    const awayCandidate = match.away_team ?? simulated?.away?.team ?? null;

    return {
      ...match,
      match_date: match.match_date ?? ROUND32_DATES_BR[match.match_number] ?? null,
      display_home_team: getVisibleTeam(match.home_slot, homeCandidate, games),
      display_away_team: getVisibleTeam(match.away_slot, awayCandidate, games),
    };
  });
}