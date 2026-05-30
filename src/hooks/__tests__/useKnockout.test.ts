import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKnockout } from '@/hooks/useKnockout';
import { Game } from '@/types/game';

vi.mock('@/services/standings/knockoutQualification', () => ({
  generateRound32: vi.fn(() => [
    { home: { team: 'BRA', group: 'A', position: '1' }, away: { team: 'ARG', group: 'B', position: '2' } },
  ]),
}));

import { generateRound32 } from '@/services/standings/knockoutQualification';

const mockGames: Game[] = [
  { id: 'g1', team_a: 'BRA', team_b: 'ARG', group: 'A', match_date: '2026-06-10', score_a: 2, score_b: 1 },
];

describe('useKnockout Hook', () => {
  it('should return round32 matches', () => {
    const { result } = renderHook(() => useKnockout(mockGames));
    expect(result.current.round32).toHaveLength(1);
    expect(result.current.round32[0].home?.team).toBe('BRA');
  });

  it('should call generateRound32 with provided games', () => {
    renderHook(() => useKnockout(mockGames));
    expect(generateRound32).toHaveBeenCalledWith(mockGames);
  });

  it('should recompute when games change', () => {
    const { rerender } = renderHook(
      ({ games }) => useKnockout(games),
      { initialProps: { games: mockGames } }
    );

    const newGames = [...mockGames, { id: 'g2', team_a: 'FRA', team_b: 'GER', group: 'B', match_date: '2026-06-11', score_a: null, score_b: null }];
    rerender({ games: newGames });

    expect(generateRound32).toHaveBeenCalledWith(newGames);
  });

  it('should return empty array when no games', () => {
    vi.mocked(generateRound32).mockReturnValueOnce([]);
    const { result } = renderHook(() => useKnockout([]));
    expect(result.current.round32).toEqual([]);
  });
});
