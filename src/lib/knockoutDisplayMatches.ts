import { Game } from "@/types/game";
import { KnockoutMatchRecord } from "@/types/knockout";
import { generateRound32 } from "@/services/standings/knockoutQualification";
import {
  findLiveScoreForGame,
  isLiveStatus,
  LiveScoreMatch,
} from "@/hooks/useLiveScores";

export type DisplayKnockoutMatch = KnockoutMatchRecord & {
  display_home_team: string | null;
  display_away_team: string | null;
  /** This match itself is currently in progress: live scores have been
   * folded into `official_score_home/away` and `winner_team` may carry
   * a provisional leader. Triggers the "Ao vivo" badge. */
  live?: boolean;
  /** At least one of the displayed teams came from a live cascade
   * upstream (a downstream `W{id}` / `L{id}` slot resolved against a
   * not-yet-official winner). The match itself is NOT live — the UI
   * should only soften the team names to read as tentative, without
   * the live badge or border. */
  tentative_teams?: boolean;
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

function knockoutMatchToGameStub(match: DisplayKnockoutMatch): Game | null {
  if (!match.match_date) return null;
  if (!match.display_home_team || !match.display_away_team) return null;

  return {
    id: `knockout-${match.id}`,
    phase: match.round,
    group_name: null,
    match_order: match.match_number,
    match_date: match.match_date,
    team_a: match.display_home_team,
    team_b: match.display_away_team,
    official_score_a: match.official_score_home,
    official_score_b: match.official_score_away,
    locked: match.locked,
  };
}

/**
 * Pure helper: walks `buildDisplayKnockoutMatches` output and folds in
 * live-score-derived provisional state.
 *
 *   1. For every knockout match with a matching live score, if the match
 *      has no official result yet and one side is strictly ahead, set a
 *      provisional `winner_team` and surface the live score in
 *      `official_score_home/away`. Tied / 0-0 matches are left alone so
 *      a downstream slot stays "A definir" until someone leads.
 *   2. For every downstream match whose home/away slot is W{id} or L{id},
 *      resolve the slot against the provisional-winner map and project
 *      the team into `display_home_team` / `display_away_team`. Existing
 *      DB-cascaded names (already populated by the server cascade on
 *      official results) take precedence — provisional only fills in
 *      blanks.
 *
 * Final official results in the DB always win over live data — same
 * contract as `applyLiveScoresToGames` for group-stage rankings.
 */
export function applyLiveScoresToKnockoutMatches(
  matches: DisplayKnockoutMatch[],
  liveScores: LiveScoreMatch[]
): DisplayKnockoutMatch[] {
  if (liveScores.length === 0) return matches;

  // Pass 1 — fold live scores into each individual match, build a map
  // of provisional winners keyed by match id.
  const provisionalWinnerByMatchId = new Map<number, string>();
  const provisionalLoserByMatchId = new Map<number, string>();

  const withLiveScores: DisplayKnockoutMatch[] = matches.map((match) => {
    if (match.winner_team !== null) return match;

    const stub = knockoutMatchToGameStub(match);
    if (!stub) return match;

    const live = findLiveScoreForGame(stub, liveScores);
    if (!live) return match;
    if (!isLiveStatus(live.status)) return match;
    if (live.homeScore == null || live.awayScore == null) return match;

    // Tied scores produce no provisional winner — downstream slot must
    // stay open until one side actually leads.
    if (live.homeScore === live.awayScore) {
      return {
        ...match,
        live: true,
        official_score_home: live.homeScore,
        official_score_away: live.awayScore,
      };
    }

    const homeIsAhead = live.homeScore > live.awayScore;
    const winnerTeam = homeIsAhead
      ? match.display_home_team
      : match.display_away_team;
    const loserTeam = homeIsAhead
      ? match.display_away_team
      : match.display_home_team;

    if (!winnerTeam) return match;

    provisionalWinnerByMatchId.set(match.id, winnerTeam);
    if (loserTeam) provisionalLoserByMatchId.set(match.id, loserTeam);

    return {
      ...match,
      live: true,
      winner_team: winnerTeam,
      official_score_home: live.homeScore,
      official_score_away: live.awayScore,
    };
  });

  if (provisionalWinnerByMatchId.size === 0) return withLiveScores;

  // Pass 2 — cascade provisional winners into downstream W{id}/L{id}
  // slot references. We only fill in slots that the DB cascade hasn't
  // filled yet, so an official result (already populated by the server)
  // is never overwritten by a provisional one.
  const resolveSlot = (slot: string): string | null => {
    const winnerMatch = /^W(\d+)$/.exec(slot);
    if (winnerMatch) {
      return provisionalWinnerByMatchId.get(Number(winnerMatch[1])) ?? null;
    }
    const loserMatch = /^L(\d+)$/.exec(slot);
    if (loserMatch) {
      return provisionalLoserByMatchId.get(Number(loserMatch[1])) ?? null;
    }
    return null;
  };

  return withLiveScores.map((match) => {
    const provisionalHome = match.home_team
      ? null
      : resolveSlot(match.home_slot);
    const provisionalAway = match.away_team
      ? null
      : resolveSlot(match.away_slot);

    if (!provisionalHome && !provisionalAway) return match;

    return {
      ...match,
      display_home_team: provisionalHome ?? match.display_home_team,
      display_away_team: provisionalAway ?? match.display_away_team,
      tentative_teams: true,
    };
  });
}
