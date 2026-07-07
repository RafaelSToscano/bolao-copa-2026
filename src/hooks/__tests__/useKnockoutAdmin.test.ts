import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useKnockoutAdmin } from "@/hooks/useKnockoutAdmin";
import { KnockoutMatchRecord } from "@/types/knockout";
import { Game } from "@/types/game";
import { AppShellContext } from "@/components/layouts/AppShell";

vi.mock("@/services/supabase/knockoutPredictionsService", () => ({
  knockoutPredictionsService: {
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

// Wrap renderHook so the hook can read knockoutMatches from
// AppShellContext without pulling in the full shell setup.
function wrapper(shell: unknown) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      AppShellContext.Provider,
      // Cast — tests only exercise the fields useKnockoutAdmin reads.
      { value: shell as never },
      children
    );
  };
}

describe("useKnockoutAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(knockoutPredictionsService.updateKnockoutMatchResult).mockResolvedValue(undefined);
    vi.mocked(knockoutPredictionsService.syncRound32FromGroups).mockResolvedValue([]);
    vi.mocked(knockoutPredictionsService.updateKnockoutMatchTeams).mockResolvedValue(undefined);
    vi.mocked(knockoutPredictionsService.setMatchLocked).mockResolvedValue(undefined);
    vi.mocked(knockoutPredictionsService.clearAllOfficialResults).mockResolvedValue(undefined);
  });

  it("hydrates matches synchronously from the AppShell cache", () => {
    const { result } = renderHook(() => useKnockoutAdmin(), {
      wrapper: wrapper({ knockoutMatches: [baseMatch] }),
    });

    expect(result.current.matches).toEqual([baseMatch]);
    expect(result.current.isLoading).toBe(false);
  });

  it("recordResult saves then merges the update over cached matches", async () => {
    const { result } = renderHook(() => useKnockoutAdmin(), {
      wrapper: wrapper({ knockoutMatches: [baseMatch] }),
    });

    await act(async () => {
      await result.current.recordResult(1, 2, 1);
    });

    expect(knockoutPredictionsService.updateKnockoutMatchResult).toHaveBeenCalledWith(1, 2, 1);
    expect(result.current.matches[0].official_score_home).toBe(2);
    expect(result.current.matches[0].official_score_away).toBe(1);
    expect(result.current.isSaving).toBe(false);
  });

  it("syncRound32 sends games and seeds matches from the response", async () => {
    const games = [] as Game[];
    const synced = [{ ...baseMatch, home_team: "Alemanha" }];
    vi.mocked(knockoutPredictionsService.syncRound32FromGroups).mockResolvedValue(synced);

    const { result } = renderHook(() => useKnockoutAdmin(), {
      wrapper: wrapper({ knockoutMatches: [baseMatch] }),
    });

    await act(async () => {
      await result.current.syncRound32(games);
    });

    expect(knockoutPredictionsService.syncRound32FromGroups).toHaveBeenCalledWith(games);
    expect(result.current.matches).toEqual(synced);
  });

  it("setMatchTeams overrides teams manually then merges into local state", async () => {
    const { result } = renderHook(() => useKnockoutAdmin(), {
      wrapper: wrapper({ knockoutMatches: [baseMatch] }),
    });

    await act(async () => {
      await result.current.setMatchTeams(1, "Alemanha", null);
    });

    expect(knockoutPredictionsService.updateKnockoutMatchTeams).toHaveBeenCalledWith(
      1,
      "Alemanha",
      null
    );
    expect(result.current.matches[0].home_team).toBe("Alemanha");
    expect(result.current.matches[0].away_team).toBeNull();
    expect(result.current.isSaving).toBe(false);
  });

  it("setMatchLocked toggles lock without a refetch", async () => {
    const { result } = renderHook(() => useKnockoutAdmin(), {
      wrapper: wrapper({ knockoutMatches: [baseMatch] }),
    });

    await act(async () => {
      await result.current.setMatchLocked(1, true);
    });

    expect(knockoutPredictionsService.setMatchLocked).toHaveBeenCalledWith(1, true);
    expect(result.current.matches[0].locked).toBe(true);
  });

  it("clearAllResults wipes matches locally after the DB write", async () => {
    const { result } = renderHook(() => useKnockoutAdmin(), {
      wrapper: wrapper({ knockoutMatches: [baseMatch] }),
    });

    await act(async () => {
      await result.current.clearAllResults();
    });

    expect(knockoutPredictionsService.clearAllOfficialResults).toHaveBeenCalled();
    await waitFor(() => expect(result.current.matches).toEqual([]));
  });
});
