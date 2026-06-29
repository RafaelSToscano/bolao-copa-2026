import { Game } from "@/types/game";
import { Player } from "@/types/player";
import { Prediction } from "@/types/prediction";
import { LiveScoreMatch } from "@/hooks/useLiveScores";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";
import {
  DashboardGroupLeadersPayload,
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
import { calculateKnockoutPredictionPoints } from "@/services/scoring/knockoutPredictionScoring";
import { calculateAllGroupStandings } from "@/services/standings/standingsCalculations";

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

/**
 * Folds live scores into knockout matches the same way `applyLiveScoresToGames`
 * does for group games. Matches without a kickoff date or with teams still TBD
 * are skipped (nothing to overlay). Final official scores win.
 */
export function applyLiveScoresToKnockoutMatches(
  matches: KnockoutMatchRecord[],
  liveScores: LiveScoreMatch[]
): { matches: KnockoutMatchRecord[]; provisional: boolean } {
  if (liveScores.length === 0) return { matches, provisional: false };

  let provisional = false;
  const merged = matches.map((match) => {
    if (
      match.official_score_home !== null &&
      match.official_score_away !== null
    ) {
      return match;
    }
    if (!match.match_date) return match;
    if (match.home_team === null || match.away_team === null) return match;

    const matchTime = new Date(match.match_date).getTime();
    const live = liveScores.find((m) => {
      const apiTime = new Date(m.utcDate).getTime();
      return Math.abs(apiTime - matchTime) / 60000 <= 90;
    });
    if (!live) return match;
    if (live.homeScore == null || live.awayScore == null) return match;

    provisional = true;
    return {
      ...match,
      official_score_home: live.homeScore,
      official_score_away: live.awayScore,
    };
  });

  return { matches: merged, provisional };
}

export function projectRankingTop(
  players: Player[],
  games: Game[],
  predictions: Prediction[],
  topN = 5,
  liveScores: LiveScoreMatch[] = [],
  knockoutMatches: KnockoutMatchRecord[] = [],
  knockoutPredictions: KnockoutPrediction[] = []
): DashboardRankingTopPayload {
  // Compute the OFFICIAL ranking (source of truth — finished games
  // only) AND the live ranking (with in-progress scores folded in).
  // Ship both so the client can show stable +N/-N deltas relative
  // to the DB position throughout the live match, not just between
  // consecutive polls.
  const { games: mergedGames, provisional: groupProvisional } =
    applyLiveScoresToGames(games, liveScores);
  const { matches: mergedKnockoutMatches, provisional: knockoutProvisional } =
    applyLiveScoresToKnockoutMatches(knockoutMatches, liveScores);
  const provisional = groupProvisional || knockoutProvisional;

  const liveRanking = calculateRanking(
    players,
    mergedGames,
    predictions,
    mergedKnockoutMatches,
    knockoutPredictions
  );
  // The OFFICIAL ranking must use the un-merged arrays so live
  // in-progress scores do NOT leak into it — that's the whole point of
  // shipping a separate officialTotal/officialPosition pair alongside the
  // provisional live ranking.
  const officialRanking = provisional
    ? calculateRanking(players, games, predictions, knockoutMatches, knockoutPredictions)
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
    players,
    knockoutMatches,
    knockoutPredictions
  );

  const decorate = (row: (typeof liveRanking)[number]) => ({
    ...row,
    officialPosition: officialPositionByPlayerId.get(row.id) ?? row.position,
    officialTotal: officialTotalByPlayerId.get(row.id) ?? row.total,
    lastRoundDelta: lastRoundDeltas.get(row.id) ?? 0,
  });

    const top = liveRanking.slice(0, topN).map(decorate);
  const relegationZone = liveRanking.slice(-5).map(decorate);

  const lanternaRow =
    liveRanking.length > 0 ? liveRanking[liveRanking.length - 1] : null;
  const lanterna = lanternaRow ? decorate(lanternaRow) : null;

  return { top, lanterna, relegationZone, provisional };
}

/**
 * Returns the next `limit` not-yet-finished games sorted by kickoff —
 * a flat list spanning multiple match days. Powers the dashboard's
 * tabled "Próximos jogos" card; the chip strip uses
 * `getNextMatchDayGames` directly to stay scoped to the next match
 * day.
 *
 * "Not yet finished" is decided locally — both `official_score_*`
 * columns null. We deliberately do NOT exclude games whose kickoff has
 * already passed: when football-data lags (status still TIMED after
 * the kickoff time), the game would otherwise vanish from the
 * dashboard until either upstream flips IN_PLAY or the admin records
 * a final score.
 */
export function projectUpcoming(
  games: Game[],
  limit = 5
): DashboardUpcomingPayload {
  const upcoming = games
    .filter((g) => {
      if (!g.match_date) return false;
      if (g.official_score_a !== null && g.official_score_b !== null) return false;
      return true;
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
  limit = 5,
  knockoutMatches: KnockoutMatchRecord[] = [],
  knockoutPredictions: KnockoutPrediction[] = []
): DashboardRecentPayload {
  const groupItems = games
    .filter((g) => g.official_score_a !== null && g.official_score_b !== null)
    .map((game) => {
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

  const knockoutItems = knockoutMatches
    .filter(
      (m) =>
        m.official_score_home !== null &&
        m.official_score_away !== null &&
        m.match_date &&
        m.home_team &&
        m.away_team
    )
    .map((match) => {
      const game: Game = {
        id: `knockout-${match.id}`,
        phase: match.round,
        group_name: "Mata-mata",
        match_order: match.match_number,
        match_date: match.match_date,
        team_a: match.home_team!,
        team_b: match.away_team!,
        official_score_a: match.official_score_home,
        official_score_b: match.official_score_away,
        locked: true,
      };
      const kpred = userId
        ? knockoutPredictions.find(
            (p) => p.player_id === userId && p.match_id === match.id
          ) ?? null
        : null;
      const myPrediction: Prediction | null = kpred
        ? {
            player_id: kpred.player_id,
            game_id: game.id,
            predicted_score_a: kpred.predicted_score_home,
            predicted_score_b: kpred.predicted_score_away,
          }
        : null;
      const myPoints = kpred
        ? calculateKnockoutPredictionPoints(kpred, match).points
        : 0;
      return { game, myPrediction, myPoints };
    });

  const items = [...groupItems, ...knockoutItems]
    .sort((a, b) => {
      const ad = a.game.match_date ? new Date(a.game.match_date).getTime() : 0;
      const bd = b.game.match_date ? new Date(b.game.match_date).getTime() : 0;
      return bd - ad;
    })
    .slice(0, limit);

  return { items };
}

export function projectMyStatus(
  userId: string,
  players: Player[],
  games: Game[],
  predictions: Prediction[],
  liveScores: LiveScoreMatch[] = [],
  knockoutMatches: KnockoutMatchRecord[] = [],
  knockoutPredictions: KnockoutPrediction[] = []
): DashboardMyStatusPayload {
  const { games: mergedGames, provisional: groupProvisional } =
    applyLiveScoresToGames(games, liveScores);
  const { matches: mergedKnockoutMatches, provisional: knockoutProvisional } =
    applyLiveScoresToKnockoutMatches(knockoutMatches, liveScores);
  const provisional = groupProvisional || knockoutProvisional;

  const ranking = calculateRanking(
    players,
    mergedGames,
    predictions,
    mergedKnockoutMatches,
    knockoutPredictions
  );
  const me = ranking.find((p) => p.id === userId);

  const userPredictions = predictions.filter(
    (p) =>
      p.player_id === userId &&
      p.predicted_score_a !== null &&
      p.predicted_score_b !== null
  );
  // Only count knockout slots whose teams are decided — TBD slots can't
  // be predicted yet, so including them in the denominator means the
  // user can never reach 100% until the whole bracket fills in.
  const knownKnockoutMatches = knockoutMatches.filter(
    (m) => m.home_team !== null && m.away_team !== null
  );
  const knownKnockoutMatchIds = new Set(knownKnockoutMatches.map((m) => m.id));
  const userKnockoutPredictions = knockoutPredictions.filter(
    (p) =>
      p.player_id === userId &&
      p.predicted_score_home !== null &&
      p.predicted_score_away !== null &&
      knownKnockoutMatchIds.has(p.match_id)
  );
  const totalMatches = games.length + knownKnockoutMatches.length;
  const totalFilled = userPredictions.length + userKnockoutPredictions.length;
  const completion =
    totalMatches === 0
      ? 0
      : Math.round((totalFilled / totalMatches) * 100);

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
