import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRanking } from '@/hooks/useRanking';
import { Player } from '@/types/player';
import { Game } from '@/types/game';
import { Prediction } from '@/types/prediction';

// Mock the ranking calculation
vi.mock('@/services/ranking/leaderboardCalculations', () => ({
  calculateRanking: vi.fn((players, games, predictions) => {
    return players
      .map((player) => ({
        ...player,
        total: Math.random() * 100,
        exacts: Math.floor(Math.random() * 10),
      }))
      .sort((a, b) => b.total - a.total);
  }),
}));

describe('useRanking Hook', () => {
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
      official_score_a: 1,
      official_score_b: 1,
      locked: true,
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
  ];

  it('should return ranking object', () => {
    const { result } = renderHook(() =>
      useRanking(mockPlayers, mockGames, mockPredictions)
    );

    expect(result.current).toHaveProperty('ranking');
  });

  it('should return ranking as array', () => {
    const { result } = renderHook(() =>
      useRanking(mockPlayers, mockGames, mockPredictions)
    );

    expect(Array.isArray(result.current.ranking)).toBe(true);
  });

  it('should include all players in ranking', () => {
    const { result } = renderHook(() =>
      useRanking(mockPlayers, mockGames, mockPredictions)
    );

    expect(result.current.ranking.length).toBe(mockPlayers.length);
  });

  it('should include player properties in ranking', () => {
    const { result } = renderHook(() =>
      useRanking(mockPlayers, mockGames, mockPredictions)
    );

    result.current.ranking.forEach((player) => {
      expect(player).toHaveProperty('id');
      expect(player).toHaveProperty('name');
      expect(player).toHaveProperty('total');
      expect(player).toHaveProperty('exacts');
    });
  });

  it('should have numeric total score', () => {
    const { result } = renderHook(() =>
      useRanking(mockPlayers, mockGames, mockPredictions)
    );

    result.current.ranking.forEach((player) => {
      expect(typeof player.total).toBe('number');
    });
  });

  it('should have numeric exacts count', () => {
    const { result } = renderHook(() =>
      useRanking(mockPlayers, mockGames, mockPredictions)
    );

    result.current.ranking.forEach((player) => {
      expect(typeof player.exacts).toBe('number');
    });
  });

  it('should handle empty players array', () => {
    const { result } = renderHook(() =>
      useRanking([], mockGames, mockPredictions)
    );

    expect(result.current.ranking).toEqual([]);
  });

  it('should handle empty games array', () => {
    const { result } = renderHook(() =>
      useRanking(mockPlayers, [], mockPredictions)
    );

    expect(Array.isArray(result.current.ranking)).toBe(true);
  });

  it('should handle empty predictions array', () => {
    const { result } = renderHook(() =>
      useRanking(mockPlayers, mockGames, [])
    );

    expect(Array.isArray(result.current.ranking)).toBe(true);
  });

  it('should memoize ranking across re-renders with same props', () => {
    const { result, rerender } = renderHook(() =>
      useRanking(mockPlayers, mockGames, mockPredictions)
    );

    const initialRanking = result.current.ranking;
    rerender();
    const rerenderRanking = result.current.ranking;

    expect(initialRanking).toBe(rerenderRanking);
  });

  it('should recalculate ranking when players change', () => {
    const { result, rerender } = renderHook(
      ({ players, games, predictions }) =>
        useRanking(players, games, predictions),
      {
        initialProps: {
          players: mockPlayers,
          games: mockGames,
          predictions: mockPredictions,
        },
      }
    );

    const initialRanking = result.current.ranking;

    const newPlayers = [
      ...mockPlayers,
      {
        id: 'player4',
        name: 'Lucas',
        access_code: 'code4',
        is_admin: false,
        approved: true,
      },
    ];

    rerender({
      players: newPlayers,
      games: mockGames,
      predictions: mockPredictions,
    });

    expect(result.current.ranking).not.toBe(initialRanking);
    expect(result.current.ranking.length).toBeGreaterThan(
      initialRanking.length
    );
  });

  it('should recalculate ranking when games change', () => {
    const { result, rerender } = renderHook(
      ({ players, games, predictions }) =>
        useRanking(players, games, predictions),
      {
        initialProps: {
          players: mockPlayers,
          games: mockGames,
          predictions: mockPredictions,
        },
      }
    );

    const initialRanking = result.current.ranking;

    rerender({
      players: mockPlayers,
      games: [...mockGames, {
        id: 'game3',
        phase: 'group',
        group_name: 'B',
        match_order: 3,
        match_date: '2026-06-22',
        team_a: 'Germany',
        team_b: 'France',
        official_score_a: 3,
        official_score_b: 2,
        locked: true,
      }],
      predictions: mockPredictions,
    });

    expect(result.current.ranking).not.toBe(initialRanking);
  });

  it('should recalculate ranking when predictions change', () => {
    const { result, rerender } = renderHook(
      ({ players, games, predictions }) =>
        useRanking(players, games, predictions),
      {
        initialProps: {
          players: mockPlayers,
          games: mockGames,
          predictions: mockPredictions,
        },
      }
    );

    const initialRanking = result.current.ranking;

    rerender({
      players: mockPlayers,
      games: mockGames,
      predictions: [
        ...mockPredictions,
        {
          id: 'pred3',
          player_id: 'player2',
          game_id: 'game1',
          predicted_score_a: 2,
          predicted_score_b: 1,
        },
      ],
    });

    expect(result.current.ranking).not.toBe(initialRanking);
  });

  it('should preserve player data in ranking', () => {
    const { result } = renderHook(() =>
      useRanking(mockPlayers, mockGames, mockPredictions)
    );

    result.current.ranking.forEach((player) => {
      const original = mockPlayers.find((p) => p.id === player.id);
      expect(player.name).toBe(original?.name);
      expect(player.access_code).toBe(original?.access_code);
    });
  });
});
