import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { TeamStanding } from "@/types/standings";
import { calculateGroupStandings } from "@/services/standings/standingsCalculations";

/**
 * Calculates group standings based on player predictions instead of official results
 * Used for displaying how standings would look with predicted scores
 */
export function calculateGroupStandingsFromPredictions(
  groupGames: Game[],
  playerPredictions: Prediction[],
  playerId: string
): TeamStanding[] {
  const simulatedGames = groupGames.map((game) => {
    const prediction = playerPredictions.find(
      (p) => p.player_id === playerId && p.game_id === game.id
    );

    return {
      ...game,
      official_score_a: prediction?.predicted_score_a ?? null,
      official_score_b: prediction?.predicted_score_b ?? null,
    };
  });

  return calculateGroupStandings(simulatedGames);
}

/**
 * Builds simulated games using player predictions as official scores
 */
export function buildGamesFromPredictions(
  games: Game[],
  playerPredictions: Prediction[],
  playerId: string
): Game[] {
  return games.map((game) => {
    const prediction = playerPredictions.find(
      (p) => p.player_id === playerId && p.game_id === game.id
    );

    return {
      ...game,
      official_score_a: prediction?.predicted_score_a ?? null,
      official_score_b: prediction?.predicted_score_b ?? null,
    };
  });
}
