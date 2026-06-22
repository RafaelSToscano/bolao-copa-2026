import { useState, useCallback, useRef } from "react";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { playersService } from "@/services/supabase/playersService";
import { gamesService } from "@/services/supabase/gamesService";
import { predictionsService } from "@/services/supabase/predictionsService";
import {
  readCache,
  writeCache,
  evictCache,
  CACHE_FRESH_TTL_MS,
} from "@/lib/clientCache";

const CACHE_KEY = "appData";

type CachedAppData = {
  players: Player[];
  games: Game[];
  predictions: Prediction[];
};

// Hydrate from sessionStorage so the dashboard renders with data on
// the very first paint after a route change inside the same tab. The
// supabase round-trip still runs in the background to revalidate.

export function useData() {
  // Single sessionStorage read on mount — the lazy initializer fires
  // exactly once, not on every render, and the snapshot it returns
  // seeds all downstream state slices below from the same view.
  const [initialSnapshot] = useState(() =>
    readCache<CachedAppData>(CACHE_KEY)
  );

  const [players, setPlayers] = useState<Player[]>(
    initialSnapshot?.data.players ?? []
  );
  const [games, setGames] = useState<Game[]>(
    initialSnapshot?.data.games ?? []
  );
  const [predictions, setPredictions] = useState<Prediction[]>(
    initialSnapshot?.data.predictions ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastLoadedAtRef = useRef<number | null>(initialSnapshot?.ts ?? null);
  const wasHydratedRef = useRef<boolean>(initialSnapshot != null);

    const fetchInFlightRef = useRef<Promise<void> | null>(null);

  const fetchAndStore = useCallback(async () => {
    if (fetchInFlightRef.current) {
      return fetchInFlightRef.current;
    }

    fetchInFlightRef.current = (async () => {
      const [playersData, gamesData, predictionsData] = await Promise.all([
        playersService.getAllPlayers(),
        gamesService.getAllGames(),
        predictionsService.getAllPredictions(),
      ]);

    const next: CachedAppData = {
      players: playersData,
      games: gamesData,
      predictions: predictionsData,
    };
    const now = Date.now();

          setPlayers(next.players);
      setGames(next.games);
      setPredictions(next.predictions);

      writeCache<CachedAppData>(CACHE_KEY, next, now);
      lastLoadedAtRef.current = now;
      wasHydratedRef.current = true;
    })();

    try {
      await fetchInFlightRef.current;
    } finally {
      fetchInFlightRef.current = null;
    }
  }, []);

  const loadData = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force === true;
      const now = Date.now();
      const last = lastLoadedAtRef.current;

      if (!force && last !== null && now - last < CACHE_FRESH_TTL_MS) {
        return;
      }

      const hasHydratedData = wasHydratedRef.current;
      // Show the spinner only on a true cold start. When we already
      // have a hydrated snapshot the revalidation runs silently.
      if (!hasHydratedData) setLoading(true);
      setError(null);

      try {
        await fetchAndStore();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao carregar dados.";
        setError(message);
      } finally {
        if (!hasHydratedData) setLoading(false);
      }
    },
    [fetchAndStore]
  );

  const invalidateCache = useCallback(() => {
    evictCache(CACHE_KEY);
    lastLoadedAtRef.current = null;
  }, []);

  return {
    players,
    games,
    predictions,
    loading,
    error,
    loadData,
    invalidateCache,
    setPlayers,
    setGames,
    setPredictions,
  };
}