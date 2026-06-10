import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction, PlayerScore } from "@/types/prediction";
import { calculatePredictionPoints } from "../predictions/predictionCalculations";

function getLastRoundGameIds(games: Game[]): Set<string> {
  const scored = games.filter(
    (g) => g.official_score_a !== null && g.official_score_b !== null
  );
  if (!scored.length) return new Set();
  const dates = [
    ...new Set(scored.map((g) => g.match_date?.slice(0, 10)).filter(Boolean)),
  ].sort() as string[];
  const lastDate = dates[dates.length - 1];
  return new Set(
    scored.filter((g) => g.match_date?.startsWith(lastDate)).map((g) => g.id)
  );
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
  predictions: Prediction[]
): (Player & { total: number; exacts: number })[] {
  const predMap = new Map<string, Prediction>();
  for (const p of predictions) {
    predMap.set(`${p.player_id}-${p.game_id}`, p);
  }

  return players
    .map((player) => {
      let total = 0;
      let exacts = 0;

      for (const game of games) {
        const pred = predMap.get(`${player.id}-${game.id}`);
        const result = calculatePredictionPoints(pred, game);
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
}

/**
 * Returns a map of playerId → position change since last round.
 * Positive = moved up, negative = moved down, 0 = unchanged.
 * Returns empty map when no round has been scored yet.
 */
export function calculatePositionChanges(
  currentRanking: (Player & { total: number; exacts: number })[],
  games: Game[],
  predictions: Prediction[],
  players: Player[]
): Map<string, number> {
  const lastRoundIds = getLastRoundGameIds(games);
  if (!lastRoundIds.size) return new Map();

  const gamesWithoutLastRound = games.map((g) =>
    lastRoundIds.has(g.id)
      ? { ...g, official_score_a: null, official_score_b: null }
      : g
  );

  const prevRanking = calculateRanking(players, gamesWithoutLastRound, predictions);
  const prevPositions = new Map(prevRanking.map((p, i) => [p.id, i + 1]));

  const changes = new Map<string, number>();
  currentRanking.forEach((player, i) => {
    const currentPos = i + 1;
    const prevPos = prevPositions.get(player.id) ?? currentPos;
    changes.set(player.id, prevPos - currentPos); // positive = moved up
  });

  return changes;
}
