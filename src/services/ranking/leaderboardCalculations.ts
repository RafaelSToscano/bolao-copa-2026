import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction, PlayerScore } from "@/types/prediction";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";
import { calculatePredictionPoints } from "../predictions/predictionCalculations";
import { calculateKnockoutPredictionPoints } from "../scoring/knockoutPredictionScoring";

function getLastScoredDate(
  games: Game[],
  knockoutMatches: KnockoutMatchRecord[]
): string | null {
  const dates: string[] = [];

  for (const g of games) {
    if (g.official_score_a === null || g.official_score_b === null) continue;
    const d = g.match_date?.slice(0, 10);
    if (d) dates.push(d);
  }

  for (const m of knockoutMatches) {
    if (m.official_score_home === null || m.official_score_away === null) continue;
    const d = m.match_date?.slice(0, 10);
    if (d) dates.push(d);
  }

  if (dates.length === 0) return null;
  return dates.sort()[dates.length - 1];
}

/**
 * Calculates the overall ranking/leaderboard
 * @param players - List of all players
 * @param games - List of all games
 * @param predictions - List of all predictions
 * @returns Sorted ranking with points and exact scores
 */
export function calculateRanking(
  players: Player[],
  games: Game[],
  predictions: Prediction[],
  knockoutMatches: KnockoutMatchRecord[] = [],
  knockoutPredictions: KnockoutPrediction[] = []
): (Player & { total: number; exacts: number; position: number })[] {
  const predMap = new Map<string, Prediction>();
  for (const p of predictions) {
    predMap.set(`${p.player_id}-${p.game_id}`, p);
  }

  const knockoutPredMap = new Map<string, KnockoutPrediction>();
  for (const p of knockoutPredictions) {
    knockoutPredMap.set(`${p.player_id}-${p.match_id}`, p);
  }

  const ranking = players
    .map((player) => {
      let total = 0;
      let exacts = 0;

      for (const game of games) {
        const pred = predMap.get(`${player.id}-${game.id}`);
        const result = calculatePredictionPoints(pred, game);
        total += result.points;
        exacts += result.exact;
      }

      for (const match of knockoutMatches) {
        const pred = knockoutPredMap.get(`${player.id}-${match.id}`);
        const result = calculateKnockoutPredictionPoints(pred, match);
        total += result.points;
        exacts += result.exact;
      }

      return {
        ...player,
        total,
        exacts,
      };
    })
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return b.exacts - a.exacts;
    });

    let currentPosition = 0;
  let previousTotal: number | null = null;

  return ranking.map((player, index) => {
    if (previousTotal === null || player.total !== previousTotal) {
      currentPosition = index + 1;
      previousTotal = player.total;
    }

    return {
      ...player,
      position: currentPosition,
    };
  });
}
/**
 * Returns a map of playerId → position change since last round.
 * Positive = moved up, negative = moved down, 0 = unchanged.
 * Returns empty map when no round has been scored yet.
 */
export function calculatePositionChanges(
  currentRanking: (Player & { total: number; exacts: number; position: number })[],
  games: Game[],
  predictions: Prediction[],
  players: Player[],
  knockoutMatches: KnockoutMatchRecord[] = [],
  knockoutPredictions: KnockoutPrediction[] = []
): Map<string, number> {
  const lastDate = getLastScoredDate(games, knockoutMatches);
  if (!lastDate) return new Map();

  const gamesWithoutLastRound = games.map((g) =>
    g.match_date?.startsWith(lastDate)
      ? { ...g, official_score_a: null, official_score_b: null }
      : g
  );
  const knockoutMatchesWithoutLastRound = knockoutMatches.map((m) =>
    m.match_date?.startsWith(lastDate)
      ? { ...m, official_score_home: null, official_score_away: null }
      : m
  );

  const prevRanking = calculateRanking(
    players,
    gamesWithoutLastRound,
    predictions,
    knockoutMatchesWithoutLastRound,
    knockoutPredictions
  );
  const prevPositions = new Map(prevRanking.map((p) => [p.id, p.position]));

  const changes = new Map<string, number>();
  currentRanking.forEach((player, i) => {
    const currentPos = player.position;
    const prevPos = prevPositions.get(player.id) ?? currentPos;
    changes.set(player.id, prevPos - currentPos); // positive = moved up
  });

  return changes;
}
