import { useMemo } from "react";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";
import { calculateRanking, calculatePositionChanges } from "@/services/ranking/leaderboardCalculations";

export function useRanking(
  players: Player[],
  games: Game[],
  predictions: Prediction[],
  knockoutMatches: KnockoutMatchRecord[] = [],
  knockoutPredictions: KnockoutPrediction[] = []
) {
  const ranking = useMemo(
    () =>
      calculateRanking(
        players,
        games,
        predictions,
        knockoutMatches,
        knockoutPredictions
      ),
    [players, games, predictions, knockoutMatches, knockoutPredictions]
  );

  const positionChanges = useMemo(
    () =>
      calculatePositionChanges(
        ranking,
        games,
        predictions,
        players,
        knockoutMatches,
        knockoutPredictions
      ),
    [ranking, games, predictions, players, knockoutMatches, knockoutPredictions]
  );

  return { ranking, positionChanges };
}
