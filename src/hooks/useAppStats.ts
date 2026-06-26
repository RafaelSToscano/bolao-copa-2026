import { useMemo } from "react";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";
import { isPredictionComplete } from "@/services/predictions/predictionCalculations";
import { isPredictableKnockoutRound } from "@/config/knockout";

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
    const totalPlayers = nonAdminPlayers.length;
    const predictableKnockoutMatches = knockoutMatches.filter(
      (match) =>
        isPredictableKnockoutRound(match.round) &&
        Boolean(match.home_team && match.away_team)
    );
    const totalGames = games.length + predictableKnockoutMatches.length;

    const getCompletedPredictionsCount = (playerId: string) =>
      predictions.filter(
        (prediction) =>
          prediction.player_id === playerId &&
          isPredictionComplete(prediction)
      ).length +
      knockoutPredictions.filter(
        (prediction) =>
          prediction.player_id === playerId &&
          isKnockoutPredictionComplete(prediction)
      ).length;

    const approvedPlayers = nonAdminPlayers.filter((p) => p.approved).length;
    const pendingPlayers = nonAdminPlayers.filter((p) => !p.approved).length;

    const playersWithPredictions = nonAdminPlayers.filter(
      (player) => getCompletedPredictionsCount(player.id) > 0
    ).length;

    const activePlayers = nonAdminPlayers.filter(
      (player) => getCompletedPredictionsCount(player.id) === totalGames
    ).length;

    const incompletePlayers = nonAdminPlayers.filter((player) => {
      const count = getCompletedPredictionsCount(player.id);
      return count > 0 && count < totalGames;
    }).length;

    const zeroPlayers = nonAdminPlayers.filter(
      (player) => getCompletedPredictionsCount(player.id) === 0
    ).length;

    const currentUserPredictions = currentUserId
      ? predictions.filter(
          (p) => p.player_id === currentUserId && isPredictionComplete(p)
        )
      : [];
    const currentUserKnockoutPredictions = currentUserId
      ? knockoutPredictions.filter(
          (p) => p.player_id === currentUserId && isKnockoutPredictionComplete(p)
        )
      : [];

    const totalUserGames = totalGames;
    const userPredictedGames =
      currentUserPredictions.length + currentUserKnockoutPredictions.length;
    const userPendingGames = totalUserGames - userPredictedGames;
    const userCompletion =
      totalUserGames > 0
        ? Math.round((userPredictedGames / totalUserGames) * 100)
        : 0;

    return {
      totalPlayers,
      playersWithPredictions,
      approvedPlayers,
      pendingPlayers,
      activePlayers,
      incompletePlayers,
      zeroPlayers,
      totalUserGames,
      userPredictedGames,
      userPendingGames,
      userCompletion,
    };
  }, [
    players,
    games,
    predictions,
    knockoutMatches,
    knockoutPredictions,
    currentUserId,
  ]);

  return stats;
}
