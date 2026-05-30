import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStandings } from '@/hooks/useStandings';
import { Game } from '@/types/game';

vi.mock('@/services/standings/standingsCalculations', () => ({
  calculateAllGroupStandings: vi.fn(() => ({ A: [], B: [] })),
  calculateBestThirdPlace: vi.fn(() => []),
  calculateQualifiedTeams: vi.fn(() => []),
  calculateGroupStandings: vi.fn(() => []),
}));

import {
  calculateAllGroupStandings,
  calculateBestThirdPlace,
  calculateQualifiedTeams,
} from '@/services/standings/standingsCalculations';

const mockGames: Game[] = [
  { id: 'g1', team_a: 'BRA', team_b: 'ARG', group: 'A', match_date: '2026-06-10', score_a: 2, score_b: 1 },
];

describe('useStandings Hook', () => {
  it('should return allGroupStandings, bestThirdPlace, qualifiedTeams', () => {
    const { result } = renderHook(() => useStandings(mockGames, []));
    expect(result.current.allGroupStandings).toEqual({ A: [], B: [] });
    expect(result.current.bestThirdPlace).toEqual([]);
    expect(result.current.qualifiedTeams).toEqual([]);
  });

  it('should call calculation functions with provided games', () => {
    renderHook(() => useStandings(mockGames, []));
    expect(calculateAllGroupStandings).toHaveBeenCalledWith(mockGames);
    expect(calculateBestThirdPlace).toHaveBeenCalledWith(mockGames);
    expect(calculateQualifiedTeams).toHaveBeenCalledWith(mockGames);
  });

  it('should recompute when games change', () => {
    const { rerender } = renderHook(
      ({ games }) => useStandings(games, []),
      { initialProps: { games: mockGames } }
    );

    const newGames = [...mockGames, { id: 'g2', team_a: 'FRA', team_b: 'GER', group: 'B', match_date: '2026-06-11', score_a: null, score_b: null }];
    rerender({ games: newGames });

    expect(calculateAllGroupStandings).toHaveBeenCalledWith(newGames);
  });
});
