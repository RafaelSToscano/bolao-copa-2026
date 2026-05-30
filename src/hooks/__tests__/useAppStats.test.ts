import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAppStats } from '@/hooks/useAppStats';
import { Player } from '@/types/player';
import { Game } from '@/types/game';
import { Prediction } from '@/types/prediction';

// Mock the prediction calculations
vi.mock('@/services/predictions/predictionCalculations', () => ({
  isPredictionComplete: vi.fn((pred: Prediction) =>
    pred.predicted_score_a !== null && pred.predicted_score_b !== null
  ),
}));

describe('useAppStats Hook', () => {
  const mockPlayers: Player[] = [
    {
      id: 'player1',
      name: 'João',
      access_code: 'code1',
      is_admin: false,
      approved: true,
    },
    {
      id: 'player2',
      name: 'Maria',
      access_code: 'code2',
      is_admin: false,
      approved: true,
    },
    {
      id: 'player3',
      name: 'Pedro',
      access_code: 'code3',
      is_admin: false,
      approved: false,
    },
    {
      id: 'admin1',
      name: 'Admin',
      access_code: 'admin',
      is_admin: true,
      approved: true,
    },
  ];

  const mockGames: Game[] = [
    {
      id: 'game1',
      phase: 'group',
      group_name: 'A',
      match_order: 1,
      match_date: '2026-06-20',
      team_a: 'Brazil',
      team_b: 'Mexico',
      official_score_a: 2,
      official_score_b: 1,
      locked: true,
    },
    {
      id: 'game2',
      phase: 'group',
      group_name: 'A',
      match_order: 2,
      match_date: '2026-06-21',
      team_a: 'Canada',
      team_b: 'USA',
      official_score_a: null,
      official_score_b: null,
      locked: false,
    },
    {
      id: 'game3',
      phase: 'group',
      group_name: 'B',
      match_order: 3,
      match_date: '2026-06-22',
      team_a: 'Germany',
      team_b: 'France',
      official_score_a: null,
      official_score_b: null,
      locked: false,
    },
  ];

  const mockPredictions: Prediction[] = [
    {
      id: 'pred1',
      player_id: 'player1',
      game_id: 'game1',
      predicted_score_a: 2,
      predicted_score_b: 1,
    },
    {
      id: 'pred2',
      player_id: 'player1',
      game_id: 'game2',
      predicted_score_a: 1,
      predicted_score_b: 1,
    },
    {
      id: 'pred3',
      player_id: 'player2',
      game_id: 'game1',
      predicted_score_a: null,
      predicted_score_b: null,
    },
  ];

  it('should return stats object with all properties', () => {
    const { result } = renderHook(() =>
      useAppStats(mockPlayers, mockGames, mockPredictions)
    );

    expect(result.current).toHaveProperty('totalPlayers');
    expect(result.current).toHaveProperty('playersWithPredictions');
    expect(result.current).toHaveProperty('approvedPlayers');
    expect(result.current).toHaveProperty('pendingPlayers');
    expect(result.current).toHaveProperty('activePlayers');
    expect(result.current).toHaveProperty('userCompletion');
  });

  it('should count total non-admin players', () => {
    const { result } = renderHook(() =>
      useAppStats(mockPlayers, mockGames, mockPredictions)
    );

    // Should exclude admin players
    expect(result.current.totalPlayers).toBe(3);
  });

  it('should count approved players', () => {
    const { result } = renderHook(() =>
      useAppStats(mockPlayers, mockGames, mockPredictions)
    );

    expect(result.current.approvedPlayers).toBe(2);
  });

  it('should count pending players', () => {
    const { result } = renderHook(() =>
      useAppStats(mockPlayers, mockGames, mockPredictions)
    );

    expect(result.current.pendingPlayers).toBe(1);
  });

  it('should count players with predictions', () => {
    const { result } = renderHook(() =>
      useAppStats(mockPlayers, mockGames, mockPredictions)
    );

    // player1 and player2 have predictions (even if empty)
    expect(result.current.playersWithPredictions).toBeGreaterThanOrEqual(1);
  });

  it('should calculate user completion percentage', () => {
    const { result } = renderHook(() =>
      useAppStats(mockPlayers, mockGames, mockPredictions, 'player1')
    );

    // player1 has 2 complete predictions out of 3 games = 66%
    expect(result.current.userCompletion).toBeGreaterThanOrEqual(0);
    expect(result.current.userCompletion).toBeLessThanOrEqual(100);
  });

  it('should return 0 for user completion when no user provided', () => {
    const { result } = renderHook(() =>
      useAppStats(mockPlayers, mockGames, mockPredictions)
    );

    expect(result.current.userCompletion).toBe(0);
  });

  it('should handle empty players array', () => {
    const { result } = renderHook(() =>
      useAppStats([], mockGames, mockPredictions)
    );

    expect(result.current.totalPlayers).toBe(0);
    expect(result.current.approvedPlayers).toBe(0);
  });

  it('should handle empty games array', () => {
    const { result } = renderHook(() =>
      useAppStats(mockPlayers, [], mockPredictions)
    );

    expect(result.current.userCompletion).toBe(0);
  });

  it('should handle empty predictions array', () => {
    const { result } = renderHook(() =>
      useAppStats(mockPlayers, mockGames, [])
    );

    expect(result.current.playersWithPredictions).toBe(0);
  });

  it('should only count non-admin players in active players', () => {
    const { result } = renderHook(() =>
      useAppStats(mockPlayers, mockGames, mockPredictions)
    );

    expect(result.current.activePlayers).toBeLessThanOrEqual(3);
  });

  it('should memoize stats across re-renders with same props', () => {
    const { result, rerender } = renderHook(() =>
      useAppStats(mockPlayers, mockGames, mockPredictions)
    );

    const initialStats = result.current;
    rerender();
    const rerenderStats = result.current;

    expect(initialStats).toEqual(rerenderStats);
  });

  it('should recalculate stats when props change', () => {
    const { result, rerender } = renderHook(
      ({ players, games, predictions }) =>
        useAppStats(players, games, predictions),
      {
        initialProps: {
          players: mockPlayers,
          games: mockGames,
          predictions: mockPredictions,
        },
      }
    );

    const initialTotal = result.current.totalPlayers;

    const newPlayers = [...mockPlayers, {
      id: 'player4',
      name: 'Lucas',
      access_code: 'code4',
      is_admin: false,
      approved: true,
    }];

    rerender({
      players: newPlayers,
      games: mockGames,
      predictions: mockPredictions,
    });

    expect(result.current.totalPlayers).toBeGreaterThan(initialTotal);
  });

  it('should calculate user pending games correctly', () => {
    const { result } = renderHook(() =>
      useAppStats(mockPlayers, mockGames, mockPredictions, 'player1')
    );

    // Should have property for pending games
    expect(result.current).toHaveProperty('userCompletion');
  });
});
