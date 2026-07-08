import { Game } from "@/types/game";
import { KnockoutMatchRecord } from "@/types/knockout";
import {
  getKnockoutRoundLockDeadline,
  isPredictableKnockoutRound,
} from "@/config/knockout";
import { GROUPS_PHASE_DEADLINE } from "@/config/scoring";

export type VisibleMatch = {
  id: string;
  matchDate: string | null;
  teamA: string;
  teamB: string;
  label: string;
  type: "group" | "knockout";
  // True while the round-level prediction deadline hasn't passed.
  // Consumers use this to hide crowd data that could be copied.
  predictionsOpen: boolean;
};

function areGroupPredictionsOpen(now: Date): boolean {
  return now.getTime() < GROUPS_PHASE_DEADLINE.getTime();
}

function areKnockoutPredictionsOpen(
  match: Pick<KnockoutMatchRecord, "round">,
  now: Date
): boolean {
  const deadline = getKnockoutRoundLockDeadline(match.round);
  if (!deadline) return false;
  return now.getTime() < deadline.getTime();
}

function hasGroupResult(game: Game) {
  return game.official_score_a !== null && game.official_score_b !== null;
}

function hasKnockoutResult(match: KnockoutMatchRecord) {
  return match.official_score_home !== null && match.official_score_away !== null;
}

export function getNextVisibleMatches(
  games: Game[],
  knockoutMatches: KnockoutMatchRecord[],
  limit = 2,
  now: Date = new Date()
): VisibleMatch[] {
  const groupPredictionsOpen = areGroupPredictionsOpen(now);

  const groupMatches = games
    .filter((game) => game.match_date)
    .map((game) => ({
      id: game.id,
      matchDate: game.match_date,
      teamA: game.team_a,
      teamB: game.team_b,
      label: game.group_name ? `Grupo ${game.group_name}` : "",
      type: "group" as const,
      hasResult: hasGroupResult(game),
      predictionsOpen: groupPredictionsOpen,
    }));

  const knockoutVisibleMatches = knockoutMatches
    .filter((match) => {
      if (!isPredictableKnockoutRound(match.round)) return false;
      if (!match.match_date) return false;
      if (!match.home_team || !match.away_team) return false;
      return true;
    })
    .map((match) => ({
      id: String(match.id),
      matchDate: match.match_date,
      teamA: match.home_team!,
      teamB: match.away_team!,
      label: `16 avos - Jogo ${match.match_number}`,
      type: "knockout" as const,
      hasResult: hasKnockoutResult(match),
      predictionsOpen: areKnockoutPredictionsOpen(match, now),
    }));

  const allMatches = [...groupMatches, ...knockoutVisibleMatches].sort((a, b) => {
    const dateA = a.matchDate ? new Date(a.matchDate).getTime() : Number.MAX_SAFE_INTEGER;
    const dateB = b.matchDate ? new Date(b.matchDate).getTime() : Number.MAX_SAFE_INTEGER;
    return dateA - dateB;
  });

  const firstPendingMatch = allMatches.find((match) => !match.hasResult);

  if (!firstPendingMatch) return [];

  const firstPendingTime = firstPendingMatch.matchDate
    ? new Date(firstPendingMatch.matchDate).getTime()
    : null;

  return allMatches
    .filter((match) => {
      if (match.hasResult) return false;

      if (firstPendingTime === null) {
        return match.id === firstPendingMatch.id && match.type === firstPendingMatch.type;
      }

      return match.matchDate
        ? new Date(match.matchDate).getTime() === firstPendingTime
        : false;
    })
    .slice(0, limit)
    .map(({ hasResult, ...match }) => match);
}