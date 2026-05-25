import { useMemo } from "react";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { calculateRanking } from "@/services/ranking/leaderboardCalculations";

export function useRanking(players: Player[], games: Game[], predictions: Prediction[]) {
  const ranking = useMemo(
    () => calculateRanking(players, games, predictions),
    [players, games, predictions]
  );

  return { ranking };
}
