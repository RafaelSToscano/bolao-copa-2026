import { useMemo } from "react";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { isPredictionComplete } from "@/services/predictions/predictionCalculations";

export function useAppStats(
  players: Player[],
  games: Game[],
  predictions: Prediction[],
  currentUserId?: string
) {
  const stats = useMemo(() => {
    const nonAdminPlayers = players.filter((p) => !p.is_admin);
    const totalPlayers = nonAdminPlayers.length;
    const totalGames = games.length;

    const getCompletedPredictionsCount = (playerId: string) =>
      predictions.filter(
        (prediction) =>
          prediction.player_id === playerId &&
          isPredictionComplete(prediction)
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

    const totalUserGames = totalGames;
    const userPredictedGames = currentUserPredictions.length;
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
  }, [players, games, predictions, currentUserId]);

  return stats;
}
