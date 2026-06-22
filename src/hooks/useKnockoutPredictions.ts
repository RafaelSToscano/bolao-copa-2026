import { useState, useCallback, useEffect } from "react";
import {
  KnockoutMatchRecord,
  KnockoutPrediction,
  DraftKnockoutPrediction,
} from "@/types/knockout";
import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";

const EMPTY_DRAFT: DraftKnockoutPrediction = {
  predicted_score_home: "",
  predicted_score_away: "",
  predicted_winner: "",
};

function draftFromPrediction(prediction: KnockoutPrediction): DraftKnockoutPrediction {
  return {
    predicted_score_home: prediction.predicted_score_home?.toString() ?? "",
    predicted_score_away: prediction.predicted_score_away?.toString() ?? "",
    predicted_winner: prediction.predicted_winner ?? "",
  };
}

export function useKnockoutPredictions(playerId: string | undefined) {
  const [matches, setMatches] = useState<KnockoutMatchRecord[]>([]);
  const [predictions, setPredictions] = useState<KnockoutPrediction[]>([]);
  const [drafts, setDrafts] = useState<Record<number, DraftKnockoutPrediction>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const [matchData, predictionData] = await Promise.all([
          knockoutPredictionsService.getKnockoutMatches(),
          playerId
            ? knockoutPredictionsService.getKnockoutPredictionsForPlayer(playerId)
            : Promise.resolve([]),
        ]);

        if (cancelled) return;

        setMatches(matchData);
        setPredictions(predictionData);
        setDrafts(
          Object.fromEntries(
            predictionData.map((p) => [p.match_id, draftFromPrediction(p)])
          )
        );
      } catch (err) {
        console.error("Failed to load knockout predictions:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [playerId]);

  const isLocked = useCallback(
    (matchId: number) => matches.find((m) => m.id === matchId)?.locked ?? false,
    [matches]
  );

  const savePrediction = useCallback(
    async (matchId: number, draft: DraftKnockoutPrediction) => {
      if (!playerId) return;

      const updatedPrediction: KnockoutPrediction = {
        player_id: playerId,
        match_id: matchId,
        predicted_score_home:
          draft.predicted_score_home === "" ? null : Number(draft.predicted_score_home),
        predicted_score_away:
          draft.predicted_score_away === "" ? null : Number(draft.predicted_score_away),
        predicted_winner: draft.predicted_winner === "" ? null : draft.predicted_winner,
      };

      setDrafts((prev) => ({ ...prev, [matchId]: draft }));
      setPredictions((prev) =>
        prev
          .filter((p) => !(p.player_id === playerId && p.match_id === matchId))
          .concat(updatedPrediction)
      );

      setIsSaving(true);
      try {
        await knockoutPredictionsService.upsertKnockoutPrediction(updatedPrediction);
      } catch (err) {
        console.error("Failed to save knockout prediction:", err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [playerId]
  );

  const getDraft = useCallback(
    (matchId: number) => drafts[matchId] ?? EMPTY_DRAFT,
    [drafts]
  );

  return {
    matches,
    predictions,
    drafts,
    getDraft,
    savePrediction,
    isLocked,
    isLoading,
    isSaving,
  };
}
