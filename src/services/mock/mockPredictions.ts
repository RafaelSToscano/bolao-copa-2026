import { Prediction } from "@/types/prediction";
import { MOCK_PLAYERS } from "./mockPlayers";
import { MOCK_GAMES } from "./mockGames";

function seededScore(seed: number): number {
  const x = Math.sin(seed) * 10000;
  const fraction = x - Math.floor(x);
  if (fraction < 0.3) return 0;
  if (fraction < 0.55) return 1;
  if (fraction < 0.75) return 2;
  if (fraction < 0.88) return 3;
  if (fraction < 0.95) return 4;
  return 5;
}

function buildAll(): Prediction[] {
  const predictions: Prediction[] = [];

  MOCK_PLAYERS.forEach((player, playerIndex) => {
    MOCK_GAMES.forEach((game, gameIndex) => {
      const seed = (playerIndex + 1) * 31 + gameIndex * 17;
      predictions.push({
        id: `mock-pred-${player.id}-${game.id}`,
        player_id: player.id,
        game_id: game.id,
        predicted_score_a: seededScore(seed),
        predicted_score_b: seededScore(seed + 1),
      });
    });
  });

  return predictions;
}

export const MOCK_PREDICTIONS: Prediction[] = buildAll();
