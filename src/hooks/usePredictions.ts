import { useState, useCallback } from "react";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction, DraftPrediction } from "@/types/prediction";
import { predictionsService } from "@/services/supabase/predictionsService";

export function usePredictions(
  playerId: string | undefined,
  games: Game[],
  predictions: Prediction[],
  setPredictions: (predictions: Prediction[]) => void
) {
  const [drafts, setDrafts] = useState<Record<string, DraftPrediction>>({});
  const [isSaving, setIsSaving] = useState(false);

  const saveSinglePrediction = useCallback(
    async (
      gameId: string,
      field: "predicted_score_a" | "predicted_score_b",
      value: string
    ) => {
      if (!playerId) return;

      const parsedValue = value === "" ? null : Number(value);

      const existing = predictions.find(
        (p) => p.player_id === playerId && p.game_id === gameId
      );

      const updatedPrediction: Prediction = {
        player_id: playerId,
        game_id: gameId,
        predicted_score_a:
          field === "predicted_score_a"
            ? parsedValue
            : existing?.predicted_score_a ?? null,
        predicted_score_b:
          field === "predicted_score_b"
            ? parsedValue
            : existing?.predicted_score_b ?? null,
      };

      // Update local state
      setPredictions(
        predictions
          .filter(
            (p) => !(p.player_id === playerId && p.game_id === gameId)
          )
          .concat(updatedPrediction)
      );

      // Save to Supabase
      try {
        await predictionsService.upsertPrediction(updatedPrediction);
      } catch (err) {
        console.error("Failed to save prediction:", err);
      }
    },
    [playerId, predictions, setPredictions]
  );

  const saveBatchPredictions = useCallback(
    async (newPredictions: Prediction[]) => {
      if (!playerId) return;

      setIsSaving(true);
      try {
        await predictionsService.upsertPredictions(newPredictions);

        // Update local state
        const updatedPredictions = predictions.filter(
          (p) =>
            !newPredictions.some(
              (np) =>
                np.player_id === p.player_id && np.game_id === p.game_id
            )
        );
        setPredictions([...updatedPredictions, ...newPredictions]);
      } catch (err) {
        console.error("Failed to save predictions:", err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [playerId, predictions, setPredictions]
  );

  return {
    drafts,
    setDrafts,
    isSaving,
    saveSinglePrediction,
    saveBatchPredictions,
  };
}
