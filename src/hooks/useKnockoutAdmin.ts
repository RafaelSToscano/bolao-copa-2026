import { useState, useCallback, useEffect } from "react";
import { Game } from "@/types/game";
import { KnockoutMatchRecord } from "@/types/knockout";
import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";

export function useKnockoutAdmin() {
  const [matches, setMatches] = useState<KnockoutMatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await knockoutPredictionsService.getKnockoutMatches();
      setMatches(data);
    } catch (err) {
      console.error("Failed to load knockout matches:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar mata-mata.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await knockoutPredictionsService.getKnockoutMatches();
        if (!cancelled) setMatches(data);
      } catch (err) {
        console.error("Failed to load knockout matches:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar mata-mata.");
        }
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
      setError(null);
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
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao salvar resultado do mata-mata.";
        setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [refresh]
  );

  const populateRound32 = useCallback(
    async (games: Game[]) => {
      setIsSaving(true);
      setError(null);
      try {
        await knockoutPredictionsService.populateRound32FromGroups(games);
        await refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao popular confrontos.";
        setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [refresh]
  );

  const setMatchTeams = useCallback(
    async (matchId: number, homeTeam: string | null, awayTeam: string | null) => {
      setIsSaving(true);
      setError(null);
      try {
        await knockoutPredictionsService.updateKnockoutMatchTeams(matchId, homeTeam, awayTeam);
        await refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao salvar times do confronto.";
        setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [refresh]
  );

  const setMatchLocked = useCallback(
    async (matchId: number, locked: boolean) => {
      setIsSaving(true);
      setError(null);
      try {
        await knockoutPredictionsService.setMatchLocked(matchId, locked);
        await refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao alterar bloqueio.";
        setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [refresh]
  );

  const clearAllResults = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      await knockoutPredictionsService.clearAllOfficialResults();
      await refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao limpar dados oficiais.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [refresh]);

  return {
    matches,
    isLoading,
    isSaving,
    error,
    recordResult,
    populateRound32,
    setMatchTeams,
    setMatchLocked,
    clearAllResults,
    refresh,
  };
}
