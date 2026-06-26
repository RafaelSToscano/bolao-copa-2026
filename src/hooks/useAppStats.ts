import { useMemo } from "react";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";
import { isPredictionComplete } from "@/services/predictions/predictionCalculations";

function isKnockoutPredictionComplete(prediction: KnockoutPrediction): boolean {
  return (
    prediction.predicted_score_home !== null &&
    prediction.predicted_score_away !== null
  );
}

export function useAppStats(
  players: Player[],
  games: Game[],
  predictions: Prediction[],
  currentUserId?: string,
  knockoutMatches: KnockoutMatchRecord[] = [],
  knockoutPredictions: KnockoutPrediction[] = []
) {
  const stats = useMemo(() => {
    const nonAdminPlayers = players.filter((p) => !p.is_admin);
    const approvedPlayersList = nonAdminPlayers.filter((p) => p.approved);
    const pendingPlayersList = nonAdminPlayers.filter((p) => !p.approved);

    const predictableKnockoutMatches = knockoutMatches.filter(
      (match) => match.round === "r32"
    );

    const totalGames = games.length + predictableKnockoutMatches.length;

    const completedByPlayer = (playerId: string) => {
      const groupCompleted = predictions.filter(
        (prediction) =>
          prediction.player_id === playerId &&
          isPredictionComplete(prediction)
      ).length;

      const knockoutCompleted = knockoutPredictions.filter(
        (prediction) =>
          prediction.player_id === playerId &&
          isKnockoutPredictionComplete(prediction)
      ).length;

      return groupCompleted + knockoutCompleted;
    };

    const currentUserCompleted = currentUserId
      ? completedByPlayer(currentUserId)
      : 0;

    const userPendingGames = Math.max(totalGames - currentUserCompleted, 0);

    const userCompletion =
      totalGames > 0 ? Math.round((currentUserCompleted / totalGames) * 100) : 0;

    const activePlayers = approvedPlayersList.filter(
      (player) => completedByPlayer(player.id) > 0
    ).length;

    const incompletePlayers = approvedPlayersList.filter((player) => {
      const completed = completedByPlayer(player.id);
      return completed > 0 && completed < totalGames;
    }).length;

    const zeroPlayers = approvedPlayersList.filter(
      (player) => completedByPlayer(player.id) === 0
    ).length;

    return {
      totalPlayers: nonAdminPlayers.length,
      approvedPlayers: approvedPlayersList.length,
      pendingPlayers: pendingPlayersList.length,
      activePlayers,
      incompletePlayers,
      zeroPlayers,
      totalGames,
      userPredictedGames: currentUserCompleted,
      userPendingGames,
      userCompletion,
    };
  }, [
    players,
    games,
    predictions,
    currentUserId,
    knockoutMatches,
    knockoutPredictions,
  ]);

  return stats;
}