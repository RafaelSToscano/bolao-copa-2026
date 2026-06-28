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
  const rankingPlayers = useMemo(
    () => players.filter((player) => player.ranking_visible !== false),
    [players]
  );

  const ranking = useMemo(
    () =>
      calculateRanking(
        rankingPlayers,
        games,
        predictions,
        knockoutMatches,
        knockoutPredictions
      ),
    [rankingPlayers, games, predictions, knockoutMatches, knockoutPredictions]
  );

  const positionChanges = useMemo(
    () =>
      calculatePositionChanges(
        ranking,
        games,
        predictions,
        rankingPlayers,
        knockoutMatches,
        knockoutPredictions
      ),
    [ranking, games, predictions, rankingPlayers, knockoutMatches, knockoutPredictions]
  );

  return { ranking, positionChanges };
}