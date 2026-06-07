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
    const totalPlayers = players.length;

    const playersWithPredictions = players.filter((player) =>
      predictions.some((prediction) => prediction.player_id === player.id)
    ).length;

    const approvedPlayers = players.filter((p) => p.approved).length;
    const pendingPlayers = players.filter((p) => !p.approved).length;

    const activePlayers = players.filter((player) =>
      predictions.some((prediction) => prediction.player_id === player.id)
    ).length;

    const currentUserPredictions = currentUserId
      ? predictions.filter(
          (p) => p.player_id === currentUserId && isPredictionComplete(p)
        )
      : [];

    const totalUserGames = games.length;
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
      totalUserGames,
      userPredictedGames,
      userPendingGames,
      userCompletion,
    };
  }, [players, games, predictions, currentUserId]);

  return stats;
}