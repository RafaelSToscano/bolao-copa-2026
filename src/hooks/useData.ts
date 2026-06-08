import { useState, useCallback } from "react";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { playersService } from "@/services/supabase/playersService";
import { gamesService } from "@/services/supabase/gamesService";
import { predictionsService } from "@/services/supabase/predictionsService";

function mergePredictions(
  allPredictions: Prediction[],
  userPredictions: Prediction[]
): Prediction[] {
  const map = new Map<string, Prediction>();

  [...allPredictions, ...userPredictions].forEach((prediction) => {
    map.set(
      `${prediction.player_id}-${prediction.game_id}`,
      prediction
    );
  });

  return Array.from(map.values());
}

export function useData() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (currentUserId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const [playersData, gamesData, predictionsData] = await Promise.all([
      playersService.getAllPlayers(),
     gamesService.getAllGames(),
     predictionsService.getAllPredictions(),
]);
      console.log("PLAYERS:", playersData.length);
      console.log("GAMES:", gamesData.length);
      console.log("PREDICTIONS:", predictionsData.length);

      let mergedPredictions = predictionsData;

      if (currentUserId) {
  const userPredictions =
    await predictionsService.getPredictionsForPlayer(currentUserId);

      mergedPredictions = mergePredictions(
    predictionsData,
    userPredictions
  );
}

console.log("MERGED PREDICTIONS:", mergedPredictions.length);

      if (currentUserId) {
        const userPredictions =
          await predictionsService.getPredictionsForPlayer(currentUserId);

        mergedPredictions = mergePredictions(
          predictionsData,
          userPredictions
        );
      }

      setPlayers(playersData);
      setGames(gamesData);
      setPredictions(mergedPredictions);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar dados.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    players,
    games,
    predictions,
    loading,
    error,
    loadData,
    setPlayers,
    setGames,
    setPredictions,
  };
}