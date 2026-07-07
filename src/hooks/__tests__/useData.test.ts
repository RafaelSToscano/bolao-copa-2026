import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useData } from '@/hooks/useData';

vi.mock('@/services/supabase/playersService', () => ({
  playersService: {
    getAllPlayers: vi.fn(),
    getPublicPlayers: vi.fn(),
  },
}));
vi.mock('@/services/supabase/gamesService', () => ({
  gamesService: { getAllGames: vi.fn() },
}));
vi.mock('@/services/supabase/predictionsService', () => ({
  predictionsService: {
    getAllPredictions: vi.fn(),
    getPredictionsForPlayer: vi.fn(),
  },
}));
vi.mock('@/services/supabase/knockoutPredictionsService', () => ({
  knockoutPredictionsService: {
    getKnockoutMatches: vi.fn(async () => []),
    getAllKnockoutPredictions: vi.fn(async () => []),
    getKnockoutPredictionsForPlayer: vi.fn(async () => []),
  },
}));

import { playersService } from '@/services/supabase/playersService';

const CACHE_KEY = 'bolao_cache_v1:appData:anon:own-predictions:public-players';
const CACHE_KEY_ALL_PREDICTIONS =
  'bolao_cache_v1:appData:anon:all-predictions:public-players';

const mockPlayers = [{ id: 'p1', name: 'João', access_code: 'A', is_admin: false, approved: true }];
const mockGames = [{ id: 'g1', team_a: 'BRA', team_b: 'ARG', group: 'A', match_date: '2026-06-10', score_a: null, score_b: null }];
const mockPredictions = [{ player_id: 'p1', game_id: 'g1', predicted_score_a: 2, predicted_score_b: 1 }];

function mockBootstrapResponse(body: unknown) {
  const fetchMock = vi.fn(async (...args: unknown[]) => {
    // Reference args so its type stays inferrable as unknown[] and
    // mock.calls[N][0] resolves to `unknown` in TS.
    void args;
    return {
      ok: true,
      json: async () => body,
    } as unknown as Response;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('useData Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    // Clear the SWR snapshot so each test starts from a cold cache.
    sessionStorage.clear();
  });

  it('should initialize with empty state', () => {
    mockBootstrapResponse({
      players: [],
      games: [],
      predictions: [],
      knockoutMatches: [],
      knockoutPredictions: [],
    });
    const { result } = renderHook(() => useData());
    expect(result.current.players).toEqual([]);
    expect(result.current.games).toEqual([]);
    expect(result.current.predictions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load data successfully from /api/bootstrap', async () => {
    const fetchMock = mockBootstrapResponse({
      players: mockPlayers,
      games: mockGames,
      predictions: mockPredictions,
      knockoutMatches: [],
      knockoutPredictions: [],
    });

    const { result } = renderHook(() =>
      useData(undefined, { includeAllPredictions: true })
    );

    await act(async () => {
      await result.current.loadData();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/bootstrap'),
      expect.any(Object)
    );
    expect(String(fetchMock.mock.calls[0]?.[0] ?? '')).toContain('all=1');
    expect(result.current.players).toEqual(mockPlayers);
    expect(result.current.games).toEqual(mockGames);
    expect(result.current.predictions).toEqual(mockPredictions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('falls back to direct Supabase for the admin private-players variant', async () => {
    vi.mocked(playersService.getAllPlayers).mockResolvedValue(mockPlayers as unknown as Awaited<ReturnType<typeof playersService.getAllPlayers>>);

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useData('admin-1', { includePrivatePlayers: true })
    );

    await act(async () => {
      await result.current.loadData();
    });

    expect(playersService.getAllPlayers).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should set loading true while fetching', async () => {
    let resolveLoad: (v: unknown) => void;
    const pending = new Promise((resolve) => { resolveLoad = resolve; });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        pending.then(() => ({
          ok: true,
          json: async () => ({
            players: mockPlayers,
            games: mockGames,
            predictions: mockPredictions,
            knockoutMatches: [],
            knockoutPredictions: [],
          }),
        }))
      )
    );

    const { result } = renderHook(() => useData());

    act(() => {
      result.current.loadData();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => { resolveLoad!(undefined); });
    expect(result.current.loading).toBe(false);
  });

  it('should expose setters for state updates', () => {
    mockBootstrapResponse({
      players: [],
      games: [],
      predictions: [],
      knockoutMatches: [],
      knockoutPredictions: [],
    });
    const { result } = renderHook(() => useData());
    act(() => {
      result.current.setPlayers(mockPlayers as unknown as Parameters<typeof result.current.setPlayers>[0]);
    });
    expect(result.current.players).toEqual(mockPlayers);
  });

  it('hydrates synchronously from sessionStorage on mount', () => {
    mockBootstrapResponse({
      players: [],
      games: [],
      predictions: [],
      knockoutMatches: [],
      knockoutPredictions: [],
    });
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        ts: Date.now(),
        data: {
          players: mockPlayers,
          games: mockGames,
          predictions: mockPredictions,
        },
      })
    );

    const { result } = renderHook(() => useData());

    // Synchronous: no act/await needed.
    expect(result.current.players).toEqual(mockPlayers);
    expect(result.current.games).toEqual(mockGames);
    expect(result.current.predictions).toEqual(mockPredictions);
  });

  it('skips refetch when hydrated cache is fresh', async () => {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        ts: Date.now(),
        data: { players: [], games: [], predictions: [] },
      })
    );
    const fetchMock = mockBootstrapResponse({
      players: mockPlayers,
      games: mockGames,
      predictions: mockPredictions,
      knockoutMatches: [],
      knockoutPredictions: [],
    });

    const { result } = renderHook(() => useData());

    await act(async () => {
      await result.current.loadData();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refetches when cache is stale', async () => {
    // Client TTL matches the 3h server cache; use a timestamp past it.
    const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        ts: fourHoursAgo,
        data: { players: [], games: [], predictions: [] },
      })
    );
    const fetchMock = mockBootstrapResponse({
      players: mockPlayers,
      games: mockGames,
      predictions: mockPredictions,
      knockoutMatches: [],
      knockoutPredictions: [],
    });

    const { result } = renderHook(() => useData());

    await act(async () => {
      await result.current.loadData();
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(result.current.players).toEqual(mockPlayers);
  });

  it('invalidateCache forces the next loadData to refetch', async () => {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        ts: Date.now(),
        data: { players: [], games: [], predictions: [] },
      })
    );
    const fetchMock = mockBootstrapResponse({
      players: mockPlayers,
      games: mockGames,
      predictions: mockPredictions,
      knockoutMatches: [],
      knockoutPredictions: [],
    });

    const { result } = renderHook(() => useData());

    await act(async () => {
      await result.current.loadData();
    });
    expect(fetchMock).not.toHaveBeenCalled();

    act(() => {
      result.current.invalidateCache();
    });

    await act(async () => {
      await result.current.loadData();
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(sessionStorage.getItem(CACHE_KEY)).toBeTruthy();
  });

  it('writes the latest snapshot to sessionStorage after a fetch', async () => {
    mockBootstrapResponse({
      players: mockPlayers,
      games: mockGames,
      predictions: mockPredictions,
      knockoutMatches: [],
      knockoutPredictions: [],
    });

    const { result } = renderHook(() =>
      useData(undefined, { includeAllPredictions: true })
    );

    await act(async () => {
      await result.current.loadData();
    });

    const raw = sessionStorage.getItem(CACHE_KEY_ALL_PREDICTIONS);
    expect(raw).toBeTruthy();
    const cached = JSON.parse(raw!);
    expect(cached.data.players).toEqual(mockPlayers);
    expect(cached.data.games).toEqual(mockGames);
    expect(cached.data.predictions).toEqual(mockPredictions);
  });
});
