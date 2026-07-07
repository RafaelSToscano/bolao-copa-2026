import { useContext, useState, useCallback, useMemo } from "react";
import { Game } from "@/types/game";
import { KnockoutMatchRecord } from "@/types/knockout";
import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";
import { evictDashboardCache } from "@/lib/evictDashboardCache";
import { AppShellContext } from "@/components/layouts/AppShell";

/**
 * Admin knockout mutations. Reads come from the shared AppShell cache
 * (bootstrap payload, TTL 3h, evicted on admin writes) — no DB round
 * trip on mount or on refresh. Writes still hit Supabase (that's the
 * whole point), then fire the eviction so every viewer's next request
 * repopulates the 3h cache once from the DB.
 *
 * The optimistic `matches` state is merged over the shared cache so
 * the admin sees their write instantly, without a rehydration
 * round-trip.
 */
export function useKnockoutAdmin(currentUserId?: string) {
  const shell = useContext(AppShellContext);
  const cachedMatches: KnockoutMatchRecord[] = useMemo(
    () => shell?.knockoutMatches ?? [],
    [shell?.knockoutMatches]
  );

  const [override, setOverride] = useState<KnockoutMatchRecord[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = override ?? cachedMatches;

  // Kept for API compatibility. The bootstrap cache always has the
  // data ready, so a manual refresh is a no-op that just clears any
  // optimistic override so the cached snapshot takes over again.
  const refresh = useCallback(async () => {
    setOverride(null);
  }, []);

  const syncRound32 = useCallback(
    async (games: Game[]) => {
      setIsSaving(true);
      setError(null);

      try {
        const updatedMatches =
          await knockoutPredictionsService.syncRound32FromGroups(games);

        setOverride(updatedMatches);
        evictDashboardCache(currentUserId);
        window.dispatchEvent(new Event("knockout-matches-updated"));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao sincronizar 16 avos.";
        setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [currentUserId]
  );

  const recordResult = useCallback(
    async (
      matchId: number,
      scoreHome: number | null,
      scoreAway: number | null
    ) => {
      setIsSaving(true);
      setError(null);

      try {
        await knockoutPredictionsService.updateKnockoutMatchResult(
          matchId,
          scoreHome,
          scoreAway
        );

        setOverride((prev) => {
          const base = prev ?? cachedMatches;
          return base.map((m) =>
            m.id === matchId
              ? {
                  ...m,
                  official_score_home: scoreHome,
                  official_score_away: scoreAway,
                }
              : m
          );
        });
        evictDashboardCache(currentUserId);
        window.dispatchEvent(new Event("knockout-matches-updated"));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao salvar resultado do mata-mata.";
        setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [cachedMatches, currentUserId]
  );

  const setMatchTeams = useCallback(
    async (matchId: number, homeTeam: string | null, awayTeam: string | null) => {
      setIsSaving(true);
      setError(null);

      try {
        await knockoutPredictionsService.updateKnockoutMatchTeams(
          matchId,
          homeTeam,
          awayTeam
        );

        setOverride((prev) => {
          const base = prev ?? cachedMatches;
          return base.map((m) =>
            m.id === matchId
              ? { ...m, home_team: homeTeam, away_team: awayTeam }
              : m
          );
        });
        evictDashboardCache(currentUserId);
        window.dispatchEvent(new Event("knockout-matches-updated"));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao salvar times do confronto.";
        setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [cachedMatches, currentUserId]
  );

  const setMatchLocked = useCallback(
    async (matchId: number, locked: boolean) => {
      setIsSaving(true);
      setError(null);

      try {
        await knockoutPredictionsService.setMatchLocked(matchId, locked);
        setOverride((prev) => {
          const base = prev ?? cachedMatches;
          return base.map((m) => (m.id === matchId ? { ...m, locked } : m));
        });
        evictDashboardCache(currentUserId);
        window.dispatchEvent(new Event("knockout-matches-updated"));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao alterar bloqueio.";
        setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [cachedMatches, currentUserId]
  );

  const clearAllResults = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      await knockoutPredictionsService.clearAllOfficialResults();
      setOverride([]);
      evictDashboardCache(currentUserId);
      window.dispatchEvent(new Event("knockout-matches-updated"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao limpar dados oficiais.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [currentUserId]);

  // Data is always ready synchronously from the shared cache.
  const isLoading = false;

  return {
    matches,
    isLoading,
    isSaving,
    error,
    recordResult,
    syncRound32,
    setMatchTeams,
    setMatchLocked,
    clearAllResults,
    refresh,
  };
}
