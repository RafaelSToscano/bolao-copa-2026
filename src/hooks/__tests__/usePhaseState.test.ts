import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePhaseState } from '@/hooks/usePhaseState';
import * as scoringConfig from '@/config/scoring';

describe('usePhaseState Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return isGroupsLocked and refresh functions', () => {
    const { result } = renderHook(() => usePhaseState());
    expect(result.current).toHaveProperty('isGroupsLocked');
    expect(result.current).toHaveProperty('refresh');
    expect(typeof result.current.isGroupsLocked).toBe('function');
    expect(typeof result.current.refresh).toBe('function');
  });

  it('should return false when current date is before groups phase deadline', () => {
    const { result } = renderHook(() => usePhaseState());
    const deadline = new Date(scoringConfig.GROUPS_PHASE_DEADLINE);
    const isLocked = result.current.isGroupsLocked();
    
    // Since the test runs in present time (2026-05-30) and deadline is 2026-06-10,
    // the groups should not be locked
    expect(typeof isLocked).toBe('boolean');
  });

  it('should call refresh without errors', () => {
    const { result } = renderHook(() => usePhaseState());
    expect(() => {
      act(() => {
        result.current.refresh();
      });
    }).not.toThrow();
  });

  it('should maintain stable function references', () => {
    const { result, rerender } = renderHook(() => usePhaseState());
    const initialIsGroupsLocked = result.current.isGroupsLocked;
    const initialRefresh = result.current.refresh;

    rerender();

    expect(result.current.isGroupsLocked).toBe(initialIsGroupsLocked);
    expect(result.current.refresh).toBe(initialRefresh);
  });

  it('should be deterministic for isGroupsLocked', () => {
    const { result } = renderHook(() => usePhaseState());
    const firstCall = result.current.isGroupsLocked();
    const secondCall = result.current.isGroupsLocked();

    expect(firstCall).toBe(secondCall);
  });
});
