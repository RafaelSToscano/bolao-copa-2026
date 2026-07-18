import { useState, useCallback, useRef, useEffect } from "react";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";
import { playersService } from "@/services/supabase/playersService";
import { gamesService } from "@/services/supabase/gamesService";
import { predictionsService } from "@/services/supabase/predictionsService";
import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";
import {
  finalPredictionsService,
  FinalPrediction,
} from "@/services/supabase/finalPredictionsService";
import {
  tournamentResultService,
  TournamentResult,
} from "@/services/supabase/tournamentResultService";
import { fetchJson } from "@/lib/fetchJson";
import { appSettingsService, AppSettings } from "@/services/supabase/appSettingsService";
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
  finalPredictions: FinalPrediction[];
  tournamentResult: TournamentResult | null;
  appSettings: AppSettings | null;
};

const EMPTY_DATA: CachedAppData = {
  players: [],
  games: [],
  predictions: [],
  knockoutMatches: [],
  knockoutPredictions: [],
  finalPredictions: [],
  tournamentResult: null,
  appSettings: null,
};

// Hydrate from sessionStorage so the dashboard renders with data on
// the very first paint after a route change inside the same tab. The
// server round-trip (or Supabase, for the admin private variant) still
// runs in the background to revalidate.

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
  const [finalPredictions, setFinalPredictions] = useState<FinalPrediction[]>(
    initialSnapshot?.data.finalPredictions ?? []
  );
  const [tournamentResult, setTournamentResult] = useState<TournamentResult | null>(
    initialSnapshot?.data.tournamentResult ?? null
  );
  const [appSettings, setAppSettings] = useState<AppSettings | null>(
    initialSnapshot?.data.appSettings ?? null
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
      // The private-players variant needs access codes (admin only) —
      // those must NOT be cached at the CDN or in shared server memory,
      // so we keep this path on direct Supabase. Everything else goes
      // through /api/bootstrap, which shares the 3h server-side
      // ranking base-data cache and is evicted by admin writes.
      let next: CachedAppData;

      if (includePrivatePlayers) {
        const [
          playersData,
          gamesData,
          predictionsData,
          knockoutMatchesData,
          knockoutPredictionsData,
          finalPredictionsData,
          tournamentResultData,
          appSettingsData,
        ] = await Promise.all([
          playersService.getAllPlayers(),
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
          finalPredictionsService.getAll(),
          tournamentResultService.get(),
          appSettingsService.get(),
        ]);

        next = {
          players: playersData,
          games: gamesData,
          predictions: predictionsData,
          knockoutMatches: knockoutMatchesData,
          knockoutPredictions: knockoutPredictionsData,
          finalPredictions: finalPredictionsData,
          tournamentResult: tournamentResultData,
          appSettings: appSettingsData,
        };
      } else {
        const params = new URLSearchParams();
        if (playerId) params.set("userId", playerId);
        if (includeAllPredictions) params.set("all", "1");
        const qs = params.toString();
        const [payload, appSettingsData] = await Promise.all([
          fetchJson<Partial<CachedAppData>>(
            `/api/bootstrap${qs ? `?${qs}` : ""}`
          ),
          appSettingsService.get(),
        ]);

        // Keep backward compatibility with older cached/test payloads that
        // do not include tournamentResult yet. The bootstrap route now ships
        // it, so no second browser-side Supabase request is necessary.
        next = {
          players: payload?.players ?? [],
          games: payload?.games ?? [],
          predictions: payload?.predictions ?? [],
          knockoutMatches: payload?.knockoutMatches ?? [],
          knockoutPredictions: payload?.knockoutPredictions ?? [],
          finalPredictions: payload?.finalPredictions ?? [],
          tournamentResult: payload?.tournamentResult ?? null,
          appSettings: appSettingsData,
        };
      }

      const now = Date.now();

      setPlayers(next.players);
      setGames(next.games);
      setPredictions(next.predictions);
      setKnockoutMatches(next.knockoutMatches);
      setKnockoutPredictions(next.knockoutPredictions);
      setFinalPredictions(next.finalPredictions ?? []);
      setTournamentResult(next.tournamentResult ?? null);
      setAppSettings(next.appSettings ?? null);

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
          setFinalPredictions(cached.data.finalPredictions ?? []);
          setTournamentResult(cached.data.tournamentResult ?? null);
          setAppSettings(cached.data.appSettings ?? null);
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
  useEffect(() => {
    const reload = () => {
    loadData({ force: true });
  };

    window.addEventListener("knockout-predictions-updated", reload);

    return () => {
      window.removeEventListener("knockout-predictions-updated", reload);
    };
  }, [loadData]);

  return {
    players,
    games,
    predictions,
    knockoutMatches,
    knockoutPredictions,
    finalPredictions,
    tournamentResult,
    appSettings,
    loading,
    error,
    loadData,
    invalidateCache,
    setPlayers,
    setGames,
    setPredictions,
    setKnockoutMatches,
    setKnockoutPredictions,
    setFinalPredictions,
    setTournamentResult,
    setAppSettings,
  };
}
