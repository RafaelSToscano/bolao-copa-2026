import { useContext, useState, useCallback, useMemo } from "react";
import {
  KnockoutMatchRecord,
  KnockoutPrediction,
  DraftKnockoutPrediction,
} from "@/types/knockout";
import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";
import { isKnockoutMatchPredictionLocked } from "@/config/knockout";
import { AppShellContext } from "@/components/layouts/AppShell";

const EMPTY_DRAFT: DraftKnockoutPrediction = {
  predicted_score_home: "",
  predicted_score_away: "",
  predicted_winner: "",
};

function draftFromPrediction(prediction: KnockoutPrediction): DraftKnockoutPrediction {
  return {
    predicted_score_home: prediction.predicted_score_home?.toString() ?? "",
    predicted_score_away: prediction.predicted_score_away?.toString() ?? "",
    predicted_winner: "",
  };
}

/**
 * Read the knockout bracket + the caller's knockout predictions out
 * of the shared AppShell cache (fed by /api/bootstrap, TTL 3h, purged
 * on admin writes). This hook never touches Supabase for reads — the
 * only DB access is the upsert triggered by savePrediction.
 *
 * Data is derived directly from the cached snapshot each render;
 * `pendingOverrides` holds the user's optimistic writes until the
 * bootstrap cache rehydrates. This avoids the react-hooks
 * set-state-in-effect anti-pattern that a copy-in-state approach
 * would produce.
 */
export function useKnockoutPredictions(playerId: string | undefined) {
  // Read directly from context so this hook can be used in tests
  // that render components outside AppShell — falls back to empty
  // data instead of throwing. Under normal app usage the shell is
  // always mounted so this is equivalent to useAppShell().
  const shell = useContext(AppShellContext);
  const matches: KnockoutMatchRecord[] = useMemo(
    () => shell?.knockoutMatches ?? [],
    [shell?.knockoutMatches]
  );
  const cachedPredictions: KnockoutPrediction[] = useMemo(
    () => shell?.knockoutPredictions ?? [],
    [shell?.knockoutPredictions]
  );

  const cachedForPlayer = useMemo(
    () =>
      playerId
        ? cachedPredictions.filter((p) => p.player_id === playerId)
        : [],
    [cachedPredictions, playerId]
  );

  // Optimistic overrides for the current player: match_id ->
  // freshly-saved prediction. Merged over `cachedForPlayer` so the
  // input reflects the user's latest keystroke without waiting on the
  // shared cache to rehydrate.
  const [pendingOverrides, setPendingOverrides] = useState<
    Record<number, KnockoutPrediction>
  >({});
  const [pendingDrafts, setPendingDrafts] = useState<
    Record<number, DraftKnockoutPrediction>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  const predictions = useMemo(() => {
    const overrideIds = new Set(
      Object.keys(pendingOverrides).map((k) => Number(k))
    );
    const kept = cachedForPlayer.filter((p) => !overrideIds.has(p.match_id));
    return [...kept, ...Object.values(pendingOverrides)];
  }, [cachedForPlayer, pendingOverrides]);

  const drafts = useMemo<Record<number, DraftKnockoutPrediction>>(() => {
    const base = Object.fromEntries(
      cachedForPlayer.map((p) => [p.match_id, draftFromPrediction(p)])
    );
    return { ...base, ...pendingDrafts };
  }, [cachedForPlayer, pendingDrafts]);

  const isLocked = useCallback(
    (matchId: number) => {
      const match = matches.find((m) => m.id === matchId);
      return match ? isKnockoutMatchPredictionLocked(match) : true;
    },
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
        predicted_winner: null,
      };

      setPendingDrafts((prev) => ({ ...prev, [matchId]: draft }));
      setPendingOverrides((prev) => ({ ...prev, [matchId]: updatedPrediction }));

      setIsSaving(true);
      try {
        await knockoutPredictionsService.upsertKnockoutPrediction(updatedPrediction);
        // Signal useData so the shared snapshot rehydrates (bootstrap
        // returns the new value; the eviction on admin writes covers
        // the ranking side). Once the cache refreshes, `cachedForPlayer`
        // supplies the value and the override becomes redundant — we
        // could clear it here, but leaving it in place is harmless
        // since the derived predictions merge favors the override.
        window.dispatchEvent(new Event("knockout-predictions-updated"));
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

  // Data is always ready synchronously from the shared cache.
  const isLoading = false;

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
