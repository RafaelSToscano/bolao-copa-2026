import { useCallback, useMemo, useState } from "react";
import { KnockoutPrediction, DraftKnockoutPrediction } from "@/types/knockout";
import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";

interface UseKnockoutPredictionsProps {
  playerId?: string;
  knockoutPredictions: KnockoutPrediction[];
  setKnockoutPredictions: (predictions: KnockoutPrediction[]) => void;
}

export function useKnockoutPredictions({
  playerId,
  knockoutPredictions,
  setKnockoutPredictions,
}: UseKnockoutPredictionsProps) {
  const [drafts, setDrafts] = useState<Record<number, DraftKnockoutPrediction>>({});

  // Initialize drafts from existing predictions
  useMemo(() => {
    if (!playerId) return;

    const newDrafts: Record<number, DraftKnockoutPrediction> = {};
    for (const pred of knockoutPredictions) {
      if (pred.player_id === playerId) {
        newDrafts[pred.match_number] = {
          predicted_winner: pred.predicted_winner || "",
          predicted_score_a: pred.predicted_score_a?.toString() || "",
          predicted_score_b: pred.predicted_score_b?.toString() || "",
        };
      }
    }
    setDrafts(newDrafts);
  }, [playerId, knockoutPredictions]);

  /**
   * Saves a single knockout prediction
   */
  const saveSingleKnockoutPrediction = useCallback(
    async (matchNumber: number, draft: DraftKnockoutPrediction) => {
      if (!playerId) return;

      const prediction: KnockoutPrediction = {
        player_id: playerId,
        match_number,
        predicted_winner:
          draft.predicted_winner === "" ? null : (draft.predicted_winner as "home" | "away"),
        predicted_score_a: draft.predicted_score_a ? Number(draft.predicted_score_a) : null,
        predicted_score_b: draft.predicted_score_b ? Number(draft.predicted_score_b) : null,
      };

      await knockoutPredictionsService.upsertKnockoutPrediction(prediction);

      // Update local state
      setKnockoutPredictions(
        knockoutPredictions.map((p) =>
          p.player_id === playerId && p.match_number === matchNumber ? prediction : p
        ).length === knockoutPredictions.length &&
        !knockoutPredictions.some(
          (p) => p.player_id === playerId && p.match_number === matchNumber
        )
          ? [...knockoutPredictions, prediction]
          : knockoutPredictions.map((p) =>
              p.player_id === playerId && p.match_number === matchNumber ? prediction : p
            )
      );
    },
    [playerId, knockoutPredictions, setKnockoutPredictions]
  );

  /**
   * Saves multiple knockout predictions
   */
  const saveBatchKnockoutPredictions = useCallback(
    async (predictions: Array<{ matchNumber: number; draft: DraftKnockoutPrediction }>) => {
      if (!playerId) return;

      const predictionPayload: KnockoutPrediction[] = predictions.map(
        ({ matchNumber, draft }) => ({
          player_id: playerId,
          match_number: matchNumber,
          predicted_winner:
            draft.predicted_winner === "" ? null : (draft.predicted_winner as "home" | "away"),
          predicted_score_a: draft.predicted_score_a ? Number(draft.predicted_score_a) : null,
          predicted_score_b: draft.predicted_score_b ? Number(draft.predicted_score_b) : null,
        })
      );

      await knockoutPredictionsService.upsertKnockoutPredictions(predictionPayload);

      // Update local state
      const updatedPredictions = [...knockoutPredictions];
      for (const pred of predictionPayload) {
        const idx = updatedPredictions.findIndex(
          (p) => p.player_id === playerId && p.match_number === pred.match_number
        );
        if (idx >= 0) {
          updatedPredictions[idx] = pred;
        } else {
          updatedPredictions.push(pred);
        }
      }
      setKnockoutPredictions(updatedPredictions);
    },
    [playerId, knockoutPredictions, setKnockoutPredictions]
  );

  /**
   * Clears all knockout predictions for the player
   */
  const clearPlayerKnockoutPredictions = useCallback(async () => {
    if (!playerId) return;

    await knockoutPredictionsService.deleteKnockoutPredictionsForPlayer(playerId);

    // Update local state
    setKnockoutPredictions(
      knockoutPredictions.filter((p) => p.player_id !== playerId)
    );
    setDrafts({});
  }, [playerId, knockoutPredictions, setKnockoutPredictions]);

  return {
    drafts,
    setDrafts,
    saveSingleKnockoutPrediction,
    saveBatchKnockoutPredictions,
    clearPlayerKnockoutPredictions,
  };
}
