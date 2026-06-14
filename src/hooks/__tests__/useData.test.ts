import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useData } from '@/hooks/useData';

vi.mock('@/services/supabase/playersService', () => ({
  playersService: { getAllPlayers: vi.fn() },
}));
vi.mock('@/services/supabase/gamesService', () => ({
  gamesService: { getAllGames: vi.fn() },
}));
vi.mock('@/services/supabase/predictionsService', () => ({
  predictionsService: { getAllPredictions: vi.fn() },
}));

import { playersService } from '@/services/supabase/playersService';
import { gamesService } from '@/services/supabase/gamesService';
import { predictionsService } from '@/services/supabase/predictionsService';

const mockPlayers = [{ id: 'p1', name: 'João', access_code: 'A', is_admin: false, approved: true }];
const mockGames = [{ id: 'g1', team_a: 'BRA', team_b: 'ARG', group: 'A', match_date: '2026-06-10', score_a: null, score_b: null }];
const mockPredictions = [{ player_id: 'p1', game_id: 'g1', predicted_score_a: 2, predicted_score_b: 1 }];

describe('useData Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the SWR snapshot so each test starts from a cold cache.
    sessionStorage.clear();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useData());
    expect(result.current.players).toEqual([]);
    expect(result.current.games).toEqual([]);
    expect(result.current.predictions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load data successfully', async () => {
    vi.mocked(playersService.getAllPlayers).mockResolvedValue(mockPlayers);
    vi.mocked(gamesService.getAllGames).mockResolvedValue(mockGames as any);
    vi.mocked(predictionsService.getAllPredictions).mockResolvedValue(mockPredictions as any);

    const { result } = renderHook(() => useData());

    await act(async () => {
      await result.current.loadData();
    });

    expect(result.current.players).toEqual(mockPlayers);
    expect(result.current.games).toEqual(mockGames);
    expect(result.current.predictions).toEqual(mockPredictions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set loading true while fetching', async () => {
    let resolveLoad: () => void;
    const pending = new Promise<void>((resolve) => { resolveLoad = resolve; });
    vi.mocked(playersService.getAllPlayers).mockReturnValue(pending.then(() => mockPlayers));
    vi.mocked(gamesService.getAllGames).mockReturnValue(pending.then(() => mockGames as any));
    vi.mocked(predictionsService.getAllPredictions).mockReturnValue(pending.then(() => mockPredictions as any));

    const { result } = renderHook(() => useData());

    act(() => {
      result.current.loadData();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => { resolveLoad!(); });
    expect(result.current.loading).toBe(false);
  });

  it('should set error on failure', async () => {
    vi.mocked(playersService.getAllPlayers).mockRejectedValue(new Error('Network error'));
    vi.mocked(gamesService.getAllGames).mockResolvedValue([]);
    vi.mocked(predictionsService.getAllPredictions).mockResolvedValue([]);

    const { result } = renderHook(() => useData());

    await act(async () => {
      await result.current.loadData();
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });

  it('should expose setters for state updates', () => {
    const { result } = renderHook(() => useData());
    act(() => {
      result.current.setPlayers(mockPlayers);
    });
    expect(result.current.players).toEqual(mockPlayers);
  });

  it('hydrates synchronously from sessionStorage on mount', () => {
    sessionStorage.setItem(
      'bolao_cache_v1:appData',
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
      'bolao_cache_v1:appData',
      JSON.stringify({
        ts: Date.now(),
        data: { players: [], games: [], predictions: [] },
      })
    );
    vi.mocked(playersService.getAllPlayers).mockResolvedValue(mockPlayers);
    vi.mocked(gamesService.getAllGames).mockResolvedValue(mockGames as any);
    vi.mocked(predictionsService.getAllPredictions).mockResolvedValue(
      mockPredictions as any
    );

    const { result } = renderHook(() => useData());

    await act(async () => {
      await result.current.loadData();
    });

    expect(playersService.getAllPlayers).not.toHaveBeenCalled();
    expect(gamesService.getAllGames).not.toHaveBeenCalled();
    expect(predictionsService.getAllPredictions).not.toHaveBeenCalled();
  });

  it('refetches when cache is stale', async () => {
    const elevenMinutesAgo = Date.now() - 11 * 60 * 1000;
    sessionStorage.setItem(
      'bolao_cache_v1:appData',
      JSON.stringify({
        ts: elevenMinutesAgo,
        data: { players: [], games: [], predictions: [] },
      })
    );
    vi.mocked(playersService.getAllPlayers).mockResolvedValue(mockPlayers);
    vi.mocked(gamesService.getAllGames).mockResolvedValue(mockGames as any);
    vi.mocked(predictionsService.getAllPredictions).mockResolvedValue(
      mockPredictions as any
    );

    const { result } = renderHook(() => useData());

    await act(async () => {
      await result.current.loadData();
    });

    expect(playersService.getAllPlayers).toHaveBeenCalled();
    expect(result.current.players).toEqual(mockPlayers);
  });

  it('invalidateCache forces the next loadData to refetch', async () => {
    sessionStorage.setItem(
      'bolao_cache_v1:appData',
      JSON.stringify({
        ts: Date.now(),
        data: { players: [], games: [], predictions: [] },
      })
    );
    vi.mocked(playersService.getAllPlayers).mockResolvedValue(mockPlayers);
    vi.mocked(gamesService.getAllGames).mockResolvedValue(mockGames as any);
    vi.mocked(predictionsService.getAllPredictions).mockResolvedValue(
      mockPredictions as any
    );

    const { result } = renderHook(() => useData());

    await act(async () => {
      await result.current.loadData();
    });
    expect(playersService.getAllPlayers).not.toHaveBeenCalled();

    act(() => {
      result.current.invalidateCache();
    });

    await act(async () => {
      await result.current.loadData();
    });

    expect(playersService.getAllPlayers).toHaveBeenCalledOnce();
    expect(sessionStorage.getItem('bolao_cache_v1:appData')).toBeTruthy();
  });

  it('writes the latest snapshot to sessionStorage after a fetch', async () => {
    vi.mocked(playersService.getAllPlayers).mockResolvedValue(mockPlayers);
    vi.mocked(gamesService.getAllGames).mockResolvedValue(mockGames as any);
    vi.mocked(predictionsService.getAllPredictions).mockResolvedValue(
      mockPredictions as any
    );

    const { result } = renderHook(() => useData());

    await act(async () => {
      await result.current.loadData();
    });

    const raw = sessionStorage.getItem('bolao_cache_v1:appData');
    expect(raw).toBeTruthy();
    const cached = JSON.parse(raw!);
    expect(cached.data.players).toEqual(mockPlayers);
    expect(cached.data.games).toEqual(mockGames);
    expect(cached.data.predictions).toEqual(mockPredictions);
  });
});
