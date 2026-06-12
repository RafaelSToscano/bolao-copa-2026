import { Game } from "@/types/game";
import { Player } from "@/types/player";
import { Prediction } from "@/types/prediction";
import { LiveScoreMatch } from "@/hooks/useLiveScores";
import {
  DashboardGroupLeadersPayload,
  DashboardLivePayload,
  DashboardMyStatusPayload,
  DashboardRankingTopPayload,
  DashboardRecentPayload,
  DashboardUpcomingPayload,
} from "@/types/dashboard";
import {
  calculatePositionChanges,
  calculateRanking,
} from "@/services/ranking/leaderboardCalculations";
import { calculatePredictionPoints } from "@/services/predictions/predictionCalculations";
import { calculateAllGroupStandings } from "@/services/standings/standingsCalculations";

const LIVE_WINDOW_MINUTES = 180;

function nowMs(refNow: number | undefined): number {
  return refNow ?? Date.now();
}

function liveGamesAt(games: Game[], at: number): Game[] {
  return games.filter((game) => {
    if (!game.match_date) return false;
    const kickoff = new Date(game.match_date).getTime();
    const elapsedMin = (at - kickoff) / 60000;
    return elapsedMin >= 0 && elapsedMin <= LIVE_WINDOW_MINUTES;
  });
}

export function projectLive(
  games: Game[],
  liveScores: LiveScoreMatch[],
  refNow?: number
): DashboardLivePayload {
  const t = nowMs(refNow);
  const liveGames = liveGamesAt(games, t);

  let secondsUntilNextKickoff: number | null = null;
  for (const game of games) {
    if (!game.match_date) continue;
    const kickoff = new Date(game.match_date).getTime();
    const diffSec = Math.floor((kickoff - t) / 1000);
    if (diffSec >= 0) {
      if (secondsUntilNextKickoff === null || diffSec < secondsUntilNextKickoff) {
        secondsUntilNextKickoff = diffSec;
      }
    }
  }

  return { liveGames, liveScores, secondsUntilNextKickoff };
}

/**
 * Folds live scores into games so that an in-progress match contributes
 * its provisional score to the ranking computation. A game with an
 * already-set `official_score_a/b` is left untouched (final result wins).
 * Returns the merged list and whether any merge actually happened.
 */
export function applyLiveScoresToGames(
  games: Game[],
  liveScores: LiveScoreMatch[]
): { games: Game[]; provisional: boolean } {
  if (liveScores.length === 0) return { games, provisional: false };

  let provisional = false;
  const merged = games.map((game) => {
    if (game.official_score_a !== null && game.official_score_b !== null) {
      return game;
    }
    if (!game.match_date) return game;

    const gameTime = new Date(game.match_date).getTime();
    const match = liveScores.find((m) => {
      const apiTime = new Date(m.utcDate).getTime();
      return Math.abs(apiTime - gameTime) / 60000 <= 90;
    });
    if (!match) return game;
    if (match.homeScore == null || match.awayScore == null) return game;

    provisional = true;
    return {
      ...game,
      official_score_a: match.homeScore,
      official_score_b: match.awayScore,
    };
  });

  return { games: merged, provisional };
}

export function projectRankingTop(
  players: Player[],
  games: Game[],
  predictions: Prediction[],
  topN = 5,
  liveScores: LiveScoreMatch[] = []
): DashboardRankingTopPayload {
  // Compute the OFFICIAL ranking (source of truth — finished games
  // only) AND the live ranking (with in-progress scores folded in).
  // Ship both so the client can show stable +N/-N deltas relative
  // to the DB position throughout the live match, not just between
  // consecutive polls.
  const { games: merged, provisional } = applyLiveScoresToGames(games, liveScores);
  const liveRanking = calculateRanking(players, merged, predictions);
  const officialRanking = provisional
    ? calculateRanking(players, games, predictions)
    : liveRanking;

  const officialPositionByPlayerId = new Map(
    officialRanking.map((row) => [row.id, row.position])
  );
  const officialTotalByPlayerId = new Map(
    officialRanking.map((row) => [row.id, row.total])
  );

  // Mirror the Ranking screen's "since last round" arrow so the
  // dashboard shows the same delta when no live match is folding in
  // provisional points. Computed against the OFFICIAL ranking (not
  // the live one) so the value stays stable during a live match.
  const lastRoundDeltas = calculatePositionChanges(
    officialRanking,
    games,
    predictions,
    players
  );

  const decorate = (row: (typeof liveRanking)[number]) => ({
    ...row,
    officialPosition: officialPositionByPlayerId.get(row.id) ?? row.position,
    officialTotal: officialTotalByPlayerId.get(row.id) ?? row.total,
    lastRoundDelta: lastRoundDeltas.get(row.id) ?? 0,
  });

  const top = liveRanking.slice(0, topN).map(decorate);

  const lanternaRow =
    liveRanking.length > 0 ? liveRanking[liveRanking.length - 1] : null;
  const lanterna = lanternaRow ? decorate(lanternaRow) : null;

  return { top, lanterna, provisional };
}

export function projectUpcoming(
  games: Game[],
  limit = 5,
  refNow?: number
): DashboardUpcomingPayload {
  const t = nowMs(refNow);
  const upcoming = games
    .filter((g) => {
      if (!g.match_date) return false;
      if (g.official_score_a !== null && g.official_score_b !== null) return false;
      return new Date(g.match_date).getTime() > t;
    })
    .sort(
      (a, b) =>
        new Date(a.match_date!).getTime() - new Date(b.match_date!).getTime()
    )
    .slice(0, limit);
  return { games: upcoming };
}

export function projectRecent(
  games: Game[],
  predictions: Prediction[],
  userId: string | null,
  limit = 5
): DashboardRecentPayload {
  const finished = games
    .filter((g) => g.official_score_a !== null && g.official_score_b !== null)
    .sort((a, b) => {
      const ad = a.match_date ? new Date(a.match_date).getTime() : 0;
      const bd = b.match_date ? new Date(b.match_date).getTime() : 0;
      return bd - ad;
    })
    .slice(0, limit);

  const items = finished.map((game) => {
    const myPrediction = userId
      ? predictions.find(
          (p) => p.player_id === userId && p.game_id === game.id
        ) ?? null
      : null;
    const myPoints = myPrediction
      ? calculatePredictionPoints(myPrediction, game).points
      : 0;
    return { game, myPrediction, myPoints };
  });

  return { items };
}

export function projectMyStatus(
  userId: string,
  players: Player[],
  games: Game[],
  predictions: Prediction[],
  liveScores: LiveScoreMatch[] = []
): DashboardMyStatusPayload {
  const { games: merged, provisional } = applyLiveScoresToGames(games, liveScores);
  const ranking = calculateRanking(players, merged, predictions);
  const me = ranking.find((p) => p.id === userId);

  const userPredictions = predictions.filter(
    (p) =>
      p.player_id === userId &&
      p.predicted_score_a !== null &&
      p.predicted_score_b !== null
  );
  const totalGames = games.length;
  const completion =
    totalGames === 0
      ? 0
      : Math.round((userPredictions.length / totalGames) * 100);

  return {
    position: me?.position ?? null,
    total: me?.total ?? 0,
    exacts: me?.exacts ?? 0,
    completion,
    provisional,
  };
}

export function projectGroupLeaders(
  games: Game[]
): DashboardGroupLeadersPayload {
  const groupGames = games.filter((g) => g.group_name);
  const standings = calculateAllGroupStandings(groupGames);

  const groups = Object.keys(standings)
    .sort()
    .map((group) => {
      const rows = standings[group];
      const leader = rows.length > 0 ? rows[0] : null;
      return { group, leader };
    });

  return { groups };
}
