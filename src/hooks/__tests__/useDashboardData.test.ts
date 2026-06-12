import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useDashboardData,
  shouldPollFast,
  computePollIntervalMs,
  POLL_LIVE_MS,
  POLL_BASELINE_MS,
} from "@/hooks/useDashboardData";

const baseResponses = (liveGames: unknown[] = []) => ({
  "/api/dashboard/live": {
    liveGames,
    liveScores: [],
    secondsUntilNextKickoff: 600,
  },
  "/api/dashboard/ranking-top": { top: [], lanterna: null },
  "/api/dashboard/upcoming": { games: [] },
  "/api/dashboard/recent": { items: [] },
  "/api/dashboard/my-status": {
    position: 1,
    total: 0,
    exacts: 0,
    completion: 0,
  },
  "/api/dashboard/group-leaders": { groups: [] },
});

describe("polling cadence pure logic", () => {
  it("baseline when no live data", () => {
    expect(computePollIntervalMs(null)).toBe(POLL_BASELINE_MS);
  });

  it("fast when liveGames > 0", () => {
    expect(
      computePollIntervalMs({
        liveGames: [{} as never],
        liveScores: [],
        secondsUntilNextKickoff: 9999,
      })
    ).toBe(POLL_LIVE_MS);
  });

  it("fast when next kickoff is within 60s", () => {
    expect(
      computePollIntervalMs({
        liveGames: [],
        liveScores: [],
        secondsUntilNextKickoff: 30,
      })
    ).toBe(POLL_LIVE_MS);
  });

  it("baseline when next kickoff far away", () => {
    expect(
      computePollIntervalMs({
        liveGames: [],
        liveScores: [],
        secondsUntilNextKickoff: 3600,
      })
    ).toBe(POLL_BASELINE_MS);
  });

  it("baseline when secondsUntilNextKickoff is null and no live games", () => {
    expect(
      shouldPollFast({
        liveGames: [],
        liveScores: [],
        secondsUntilNextKickoff: null,
      })
    ).toBe(false);
  });
});

describe("useDashboardData", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("performs an initial fetch of all six endpoints", async () => {
    const responses = baseResponses();
    const fetchMock = vi.fn(async (url: string) => {
      const path = url.split("?")[0];
      const body = responses[path as keyof typeof responses] ?? null;
      return { ok: true, json: async () => body } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useDashboardData("user-1"));

    await vi.waitFor(() => {
      const seen = new Set(
        fetchMock.mock.calls.map((c) => (c[0] as string).split("?")[0])
      );
      expect(seen.size).toBe(6);
    });
  });

  it("flags isLive=true when liveGames is non-empty", async () => {
    const responses = baseResponses([{ id: "g1" }]);
    const fetchMock = vi.fn(async (url: string) => {
      const path = url.split("?")[0];
      const body = responses[path as keyof typeof responses] ?? null;
      return { ok: true, json: async () => body } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useDashboardData("u1"));

    await vi.waitFor(() => {
      expect(result.current.isLive).toBe(true);
    });
  });

  it("does not call my-status when no userId is provided", async () => {
    const responses = baseResponses();
    const fetchMock = vi.fn(async (url: string) => {
      const path = url.split("?")[0];
      const body = responses[path as keyof typeof responses] ?? null;
      return { ok: true, json: async () => body } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useDashboardData(undefined));

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const paths = fetchMock.mock.calls.map((c) => (c[0] as string).split("?")[0]);
    expect(paths).not.toContain("/api/dashboard/my-status");
  });
});
