import { useState, useCallback, useRef } from "react";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";
import { playersService } from "@/services/supabase/playersService";
import { gamesService } from "@/services/supabase/gamesService";
import { predictionsService } from "@/services/supabase/predictionsService";
import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";
import {
  readCache,
  writeCache,
  evictCache,
  CACHE_FRESH_TTL_MS,
} from "@/lib/clientCache";

const CACHE_KEY = "appData";

type UseDataOptions = {
  includeAllPredictions?: boolean;
  includePrivatePlayers?: boolean;
};

type CachedAppData = {
  players: Player[];
  games: Game[];
  predictions: Prediction[];
  knockoutMatches: KnockoutMatchRecord[];
  knockoutPredictions: KnockoutPrediction[];
};

// Hydrate from sessionStorage so the dashboard renders with data on
// the very first paint after a route change inside the same tab. The
// supabase round-trip still runs in the background to revalidate.

export function useData(
  playerId?: string,
  options: UseDataOptions = {}
) {
  const includeAllPredictions = options.includeAllPredictions === true;
  const includePrivatePlayers = options.includePrivatePlayers === true;
  const cacheKey = [
    CACHE_KEY,
    playerId ?? "anon",
    includeAllPredictions ? "all-predictions" : "own-predictions",
    includePrivatePlayers ? "private-players" : "public-players",
  ].join(":");
  // Single sessionStorage read on mount — the lazy initializer fires
  // exactly once, not on every render, and the snapshot it returns
  // seeds all downstream state slices below from the same view.
  const [initialSnapshot] = useState(() =>
    readCache<CachedAppData>(cacheKey)
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
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatchRecord[]>(
    initialSnapshot?.data.knockoutMatches ?? []
  );
  const [knockoutPredictions, setKnockoutPredictions] = useState<KnockoutPrediction[]>(
    initialSnapshot?.data.knockoutPredictions ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastLoadedAtRef = useRef<number | null>(initialSnapshot?.ts ?? null);
  const wasHydratedRef = useRef<boolean>(initialSnapshot != null);
  const loadedCacheKeyRef = useRef<string | null>(
    initialSnapshot ? cacheKey : null
  );

    const fetchInFlightRef = useRef<Promise<void> | null>(null);

  const fetchAndStore = useCallback(async () => {
    if (fetchInFlightRef.current) {
      return fetchInFlightRef.current;
    }

    fetchInFlightRef.current = (async () => {
      const [
        playersData,
        gamesData,
        predictionsData,
        knockoutMatchesData,
        knockoutPredictionsData,
      ] = await Promise.all([
        includePrivatePlayers
          ? playersService.getAllPlayers()
          : playersService.getPublicPlayers(),
        gamesService.getAllGames(),
        includeAllPredictions
          ? predictionsService.getAllPredictions()
          : playerId
            ? predictionsService.getPredictionsForPlayer(playerId)
            : Promise.resolve([]),
        knockoutPredictionsService.getKnockoutMatches(),
        includeAllPredictions
          ? knockoutPredictionsService.getAllKnockoutPredictions()
          : playerId
            ? knockoutPredictionsService.getKnockoutPredictionsForPlayer(playerId)
            : Promise.resolve([]),
      ]);

    const next: CachedAppData = {
      players: playersData,
      games: gamesData,
      predictions: predictionsData,
      knockoutMatches: knockoutMatchesData,
      knockoutPredictions: knockoutPredictionsData,
    };
    const now = Date.now();

      setPlayers(next.players);
      setGames(next.games);
      setPredictions(next.predictions);
      setKnockoutMatches(next.knockoutMatches);
      setKnockoutPredictions(next.knockoutPredictions);

      writeCache<CachedAppData>(cacheKey, next, now);
      lastLoadedAtRef.current = now;
      wasHydratedRef.current = true;
      loadedCacheKeyRef.current = cacheKey;
    })();

    try {
      await fetchInFlightRef.current;
    } finally {
      fetchInFlightRef.current = null;
    }
  }, [cacheKey, includeAllPredictions, includePrivatePlayers, playerId]);

  const loadData = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force === true;
      const now = Date.now();
      const last =
        loadedCacheKeyRef.current === cacheKey ? lastLoadedAtRef.current : null;

      if (!force && last !== null && now - last < CACHE_FRESH_TTL_MS) {
        return;
      }

      if (!force) {
        const cached = readCache<CachedAppData>(cacheKey);
        if (cached && now - cached.ts < CACHE_FRESH_TTL_MS) {
          setPlayers(cached.data.players);
          setGames(cached.data.games);
          setPredictions(cached.data.predictions);
          setKnockoutMatches(cached.data.knockoutMatches ?? []);
          setKnockoutPredictions(cached.data.knockoutPredictions ?? []);
          lastLoadedAtRef.current = cached.ts;
          wasHydratedRef.current = true;
          loadedCacheKeyRef.current = cacheKey;
          return;
        }
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
    [cacheKey, fetchAndStore]
  );

  const invalidateCache = useCallback(() => {
    evictCache(cacheKey);
    lastLoadedAtRef.current = null;
    loadedCacheKeyRef.current = null;
  }, [cacheKey]);

  return {
    players,
    games,
    predictions,
    knockoutMatches,
    knockoutPredictions,
    loading,
    error,
    loadData,
    invalidateCache,
    setPlayers,
    setGames,
    setPredictions,
    setKnockoutMatches,
    setKnockoutPredictions,
  };
}
