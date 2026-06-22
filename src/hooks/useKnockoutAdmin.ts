import { useState, useCallback, useEffect } from "react";
import { Game } from "@/types/game";
import { KnockoutMatchRecord } from "@/types/knockout";
import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";

export function useKnockoutAdmin() {
  const [matches, setMatches] = useState<KnockoutMatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await knockoutPredictionsService.getKnockoutMatches();
      setMatches(data);
    } catch (err) {
      console.error("Failed to load knockout matches:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const data = await knockoutPredictionsService.getKnockoutMatches();
        if (!cancelled) setMatches(data);
      } catch (err) {
        console.error("Failed to load knockout matches:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const recordResult = useCallback(
    async (
      matchId: number,
      scoreHome: number | null,
      scoreAway: number | null,
      winnerTeam: string | null
    ) => {
      setIsSaving(true);
      try {
        await knockoutPredictionsService.updateKnockoutMatchResult(
          matchId,
          scoreHome,
          scoreAway,
          winnerTeam
        );
        // The result can cascade into other matches (winner/loser advancing),
        // so re-fetch the full set rather than patch local state piecemeal.
        await refresh();
      } finally {
        setIsSaving(false);
      }
    },
    [refresh]
  );

  const populateRound32 = useCallback(
    async (games: Game[]) => {
      setIsSaving(true);
      try {
        await knockoutPredictionsService.populateRound32FromGroups(games);
        await refresh();
      } finally {
        setIsSaving(false);
      }
    },
    [refresh]
  );

  return {
    matches,
    isLoading,
    isSaving,
    recordResult,
    populateRound32,
    refresh,
  };
}
