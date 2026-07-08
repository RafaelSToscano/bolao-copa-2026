import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePredictions } from '@/hooks/usePredictions';
import { Prediction } from '@/types/prediction';

vi.mock('@/services/supabase/predictionsService', () => ({
  predictionsService: {
    upsertPrediction: vi.fn(),
    upsertPredictions: vi.fn(),
    deletePredictionsForPlayer: vi.fn(),
  },
}));

vi.mock('@/lib/evictDashboardCache', () => ({
  evictDashboardCache: vi.fn(),
}));

import { predictionsService } from '@/services/supabase/predictionsService';
import { evictDashboardCache } from '@/lib/evictDashboardCache';

const mockGames = [
  { id: 'g1', team_a: 'BRA', team_b: 'ARG', group: 'A', match_date: '2026-06-10', score_a: null, score_b: null },
  { id: 'g2', team_a: 'FRA', team_b: 'GER', group: 'B', match_date: '2026-06-11', score_a: null, score_b: null },
] as any[];

const initialPredictions: Prediction[] = [
  { player_id: 'p1', game_id: 'g1', predicted_score_a: 2, predicted_score_b: 1 },
];

describe('usePredictions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(predictionsService.upsertPrediction).mockResolvedValue(undefined as any);
    vi.mocked(predictionsService.upsertPredictions).mockResolvedValue(undefined as any);
    vi.mocked(predictionsService.deletePredictionsForPlayer).mockResolvedValue(undefined as any);
  });

  it('should initialize with empty drafts and not saving', () => {
    const setPredictions = vi.fn();
    const { result } = renderHook(() =>
      usePredictions('p1', mockGames, initialPredictions, setPredictions)
    );
    expect(result.current.drafts).toEqual({});
    expect(result.current.isSaving).toBe(false);
  });

  it('should save single prediction and update state', async () => {
    const setPredictions = vi.fn();
    const { result } = renderHook(() =>
      usePredictions('p1', mockGames, initialPredictions, setPredictions)
    );

    await act(async () => {
      await result.current.saveSinglePrediction('g1', 'predicted_score_a', '3');
    });

    expect(setPredictions).toHaveBeenCalled();
    expect(predictionsService.upsertPrediction).toHaveBeenCalledWith(
      expect.objectContaining({ player_id: 'p1', game_id: 'g1', predicted_score_a: 3 })
    );
  });

  it('should handle empty string as null in saveSinglePrediction', async () => {
    const setPredictions = vi.fn();
    const { result } = renderHook(() =>
      usePredictions('p1', mockGames, initialPredictions, setPredictions)
    );

    await act(async () => {
      await result.current.saveSinglePrediction('g1', 'predicted_score_a', '');
    });

    expect(predictionsService.upsertPrediction).toHaveBeenCalledWith(
      expect.objectContaining({ predicted_score_a: null })
    );
  });

  it('should do nothing in saveSinglePrediction when no playerId', async () => {
    const setPredictions = vi.fn();
    const { result } = renderHook(() =>
      usePredictions(undefined, mockGames, initialPredictions, setPredictions)
    );

    await act(async () => {
      await result.current.saveSinglePrediction('g1', 'predicted_score_a', '2');
    });

    expect(predictionsService.upsertPrediction).not.toHaveBeenCalled();
  });

  it('should save batch predictions', async () => {
    const setPredictions = vi.fn();
    const { result } = renderHook(() =>
      usePredictions('p1', mockGames, initialPredictions, setPredictions)
    );

    const batch: Prediction[] = [
      { player_id: 'p1', game_id: 'g2', predicted_score_a: 1, predicted_score_b: 0 },
    ];

    await act(async () => {
      await result.current.saveBatchPredictions(batch);
    });

    expect(predictionsService.upsertPredictions).toHaveBeenCalledWith(batch);
    expect(setPredictions).toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
  });

  it('requests a server-side cache evict after saving a single prediction', async () => {
    const setPredictions = vi.fn();
    const { result } = renderHook(() =>
      usePredictions('p1', mockGames, initialPredictions, setPredictions)
    );

    await act(async () => {
      await result.current.saveSinglePrediction('g1', 'predicted_score_a', '3');
    });

    expect(evictDashboardCache).toHaveBeenCalledWith('p1', {
      scope: 'user-predictions',
    });
  });

  it('requests a server-side cache evict after saving a batch', async () => {
    const setPredictions = vi.fn();
    const { result } = renderHook(() =>
      usePredictions('p1', mockGames, initialPredictions, setPredictions)
    );

    await act(async () => {
      await result.current.saveBatchPredictions([
        { player_id: 'p1', game_id: 'g2', predicted_score_a: 1, predicted_score_b: 0 },
      ]);
    });

    expect(evictDashboardCache).toHaveBeenCalledWith('p1', {
      scope: 'user-predictions',
    });
  });

  it('should clear player predictions', async () => {
    const setPredictions = vi.fn();
    const { result } = renderHook(() =>
      usePredictions('p1', mockGames, initialPredictions, setPredictions)
    );

    await act(async () => {
      await result.current.clearPlayerPredictions();
    });

    expect(predictionsService.deletePredictionsForPlayer).toHaveBeenCalledWith('p1');
    expect(setPredictions).toHaveBeenCalledWith([]);
    expect(result.current.drafts).toEqual({});
  });
});
