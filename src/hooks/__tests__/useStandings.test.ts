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
  { id: 'g1', phase: 'groups', group_name: 'A', match_order: 1, team_a: 'BRA', team_b: 'ARG', match_date: '2026-06-10', official_score_a: 2, official_score_b: 1, locked: true },
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

    const newGames: Game[] = [...mockGames, { id: 'g2', phase: 'groups', group_name: 'B', match_order: 2, team_a: 'FRA', team_b: 'GER', match_date: '2026-06-11', official_score_a: null, official_score_b: null, locked: false }];
    rerender({ games: newGames });

    expect(calculateAllGroupStandings).toHaveBeenCalledWith(newGames);
  });
});
