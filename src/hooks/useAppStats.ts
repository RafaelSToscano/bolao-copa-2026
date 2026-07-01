import { useMemo } from "react";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";
import { isPredictionComplete } from "@/services/predictions/predictionCalculations";
import { buildDisplayKnockoutMatches } from "@/lib/knockoutDisplayMatches";
import {
  isKnockoutMatchPredictionLocked,
  isPredictableKnockoutRound,
} from "@/config/knockout";

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

    const availableGroupGames = games.filter((game) => !game.locked);

    const displayKnockoutMatches = buildDisplayKnockoutMatches(
      knockoutMatches,
      games
    );

    const availableKnockoutMatches = displayKnockoutMatches.filter(
      (match) =>
        isPredictableKnockoutRound(match.round) &&
        Boolean(match.display_home_team) &&
        Boolean(match.display_away_team) &&
        !isKnockoutMatchPredictionLocked(match)
    );

    const availableKnockoutMatchIds = new Set(
      availableKnockoutMatches.map((match) => match.id)
    );

    const availableGroupGameIds = new Set(
      availableGroupGames.map((game) => game.id)
    );

    const usingKnockoutScope = availableKnockoutMatches.length > 0;

    const totalGames = usingKnockoutScope
      ? availableKnockoutMatches.length
      : availableGroupGames.length;

    const completedByPlayer = (playerId: string) => {
      if (usingKnockoutScope) {
        return knockoutPredictions.filter(
          (prediction) =>
            prediction.player_id === playerId &&
            availableKnockoutMatchIds.has(prediction.match_id) &&
            isKnockoutPredictionComplete(prediction)
        ).length;
      }

      return predictions.filter(
        (prediction) =>
          prediction.player_id === playerId &&
          availableGroupGameIds.has(prediction.game_id) &&
          isPredictionComplete(prediction)
      ).length;
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