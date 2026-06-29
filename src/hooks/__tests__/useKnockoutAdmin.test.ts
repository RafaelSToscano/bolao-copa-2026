import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useKnockoutAdmin } from "@/hooks/useKnockoutAdmin";
import { KnockoutMatchRecord } from "@/types/knockout";
import { Game } from "@/types/game";

vi.mock("@/services/supabase/knockoutPredictionsService", () => ({
  knockoutPredictionsService: {
    getKnockoutMatches: vi.fn(),
    updateKnockoutMatchResult: vi.fn(),
    syncRound32FromGroups: vi.fn(),
    updateKnockoutMatchTeams: vi.fn(),
    setMatchLocked: vi.fn(),
    clearAllOfficialResults: vi.fn(),
  },
}));

import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";

const baseMatch: KnockoutMatchRecord = {
  id: 1,
  round: "r32",
  match_number: 1,
  home_slot: "1A",
  away_slot: "2B",
  home_team: "Brasil",
  away_team: "Argentina",
  official_score_home: null,
  official_score_away: null,
  winner_team: null,
  match_date: null,
  locked: false,
};

describe("useKnockoutAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(knockoutPredictionsService.getKnockoutMatches).mockResolvedValue([baseMatch]);
    vi.mocked(knockoutPredictionsService.updateKnockoutMatchResult).mockResolvedValue(undefined);
    vi.mocked(knockoutPredictionsService.syncRound32FromGroups).mockResolvedValue([]);
    vi.mocked(knockoutPredictionsService.updateKnockoutMatchTeams).mockResolvedValue(undefined);
    vi.mocked(knockoutPredictionsService.setMatchLocked).mockResolvedValue(undefined);
    vi.mocked(knockoutPredictionsService.clearAllOfficialResults).mockResolvedValue(undefined);
  });

  it("loads matches on mount", async () => {
    const { result } = renderHook(() => useKnockoutAdmin());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(knockoutPredictionsService.getKnockoutMatches).toHaveBeenCalledTimes(1);
    expect(result.current.matches).toEqual([baseMatch]);
  });

  it("recordResult saves the result then refreshes", async () => {
    const { result } = renderHook(() => useKnockoutAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.recordResult(1, 2, 1);
    });

    expect(knockoutPredictionsService.updateKnockoutMatchResult).toHaveBeenCalledWith(
      1,
      2,
      1
    );
    expect(knockoutPredictionsService.getKnockoutMatches).toHaveBeenCalledTimes(2);
    expect(result.current.isSaving).toBe(false);
  });

  it("syncRound32 sends games and seeds matches from the response", async () => {
    const games = [] as Game[];
    const synced = [{ ...baseMatch, home_team: "Alemanha" }];
    vi.mocked(knockoutPredictionsService.syncRound32FromGroups).mockResolvedValue(synced);

    const { result } = renderHook(() => useKnockoutAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.syncRound32(games);
    });

    expect(knockoutPredictionsService.syncRound32FromGroups).toHaveBeenCalledWith(games);
    // The hook now seeds local state from syncRound32's return value, so it
    // does NOT refetch (only the initial mount call is expected).
    expect(knockoutPredictionsService.getKnockoutMatches).toHaveBeenCalledTimes(1);
    expect(result.current.matches).toEqual(synced);
  });

  it("setMatchTeams overrides teams manually then refreshes", async () => {
    const { result } = renderHook(() => useKnockoutAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setMatchTeams(1, "Alemanha", null);
    });

    expect(knockoutPredictionsService.updateKnockoutMatchTeams).toHaveBeenCalledWith(
      1,
      "Alemanha",
      null
    );
    expect(knockoutPredictionsService.getKnockoutMatches).toHaveBeenCalledTimes(2);
    expect(result.current.isSaving).toBe(false);
  });

  it("setMatchLocked blocks predictions for a single match then refreshes", async () => {
    const { result } = renderHook(() => useKnockoutAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.setMatchLocked(1, true);
    });

    expect(knockoutPredictionsService.setMatchLocked).toHaveBeenCalledWith(1, true);
    expect(knockoutPredictionsService.getKnockoutMatches).toHaveBeenCalledTimes(2);
    expect(result.current.isSaving).toBe(false);
  });

  it("clearAllResults wipes official data then refreshes", async () => {
    const { result } = renderHook(() => useKnockoutAdmin());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.clearAllResults();
    });

    expect(knockoutPredictionsService.clearAllOfficialResults).toHaveBeenCalledTimes(1);
    expect(knockoutPredictionsService.getKnockoutMatches).toHaveBeenCalledTimes(2);
  });
});
