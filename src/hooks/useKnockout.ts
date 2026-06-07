import { useMemo } from "react";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutMatch } from "@/types/knockout";
import { generateRound32 } from "@/services/standings/knockoutQualification";
import { buildGamesFromPredictions } from "@/services/standings/predictionSimulation";

export function useKnockout(games: Game[], predictions?: Prediction[], currentUserId?: string) {
  const round32 = useMemo(() => {
    // If we have predictions and a user ID, simulate based on predictions
    if (predictions && currentUserId) {
      const simulatedGames = buildGamesFromPredictions(games, predictions, currentUserId);
      return generateRound32(simulatedGames);
    }
    // Otherwise use actual games (official results)
    return generateRound32(games);
  }, [games, predictions, currentUserId]);

  return {
    round32,
  };
}
