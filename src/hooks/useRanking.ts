import { useMemo } from "react";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";
import { calculateRanking, calculatePositionChanges } from "@/services/ranking/leaderboardCalculations";

// Stable empty fallbacks: defining the defaults inline (`= []`) creates a new
// array per call, which would bust useMemo on every render.
const EMPTY_KNOCKOUT_MATCHES: KnockoutMatchRecord[] = [];
const EMPTY_KNOCKOUT_PREDICTIONS: KnockoutPrediction[] = [];

export function useRanking(
  players: Player[],
  games: Game[],
  predictions: Prediction[],
  knockoutMatches: KnockoutMatchRecord[] = EMPTY_KNOCKOUT_MATCHES,
  knockoutPredictions: KnockoutPrediction[] = EMPTY_KNOCKOUT_PREDICTIONS
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