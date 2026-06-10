import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction, PlayerScore } from "@/types/prediction";
import { calculatePredictionPoints } from "../predictions/predictionCalculations";

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
