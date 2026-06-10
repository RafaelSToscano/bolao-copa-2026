import { useMemo } from "react";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { calculateRanking, calculatePositionChanges } from "@/services/ranking/leaderboardCalculations";

export function useRanking(players: Player[], games: Game[], predictions: Prediction[]) {
  const ranking = useMemo(
    () => calculateRanking(players, games, predictions),
    [players, games, predictions]
  );

  const positionChanges = useMemo(
    () => calculatePositionChanges(ranking, games, predictions, players),
    [ranking, games, predictions, players]
  );

  return { ranking, positionChanges };
}
