import { useState, useCallback } from "react";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { playersService } from "@/services/supabase/playersService";
import { gamesService } from "@/services/supabase/gamesService";
import { predictionsService } from "@/services/supabase/predictionsService";

export function useData() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [playersData, gamesData, predictionsData] = await Promise.all([
        playersService.getAllPlayers(),
        gamesService.getAllGames(),
        predictionsService.getAllPredictions(),
      ]);

      setPlayers(playersData);
      setGames(gamesData);
      setPredictions(predictionsData);
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
