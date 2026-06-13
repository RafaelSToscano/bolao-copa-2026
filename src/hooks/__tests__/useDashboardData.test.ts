import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useDashboardData,
  shouldPollFast,
  computePollIntervalMs,
  POLL_LIVE_MS,
  POLL_BASELINE_MS,
} from "@/hooks/useDashboardData";

const baselineSignals = {
  liveGames: [],
  unmatchedLiveScores: [],
  secondsUntilNextKickoff: null,
};

const baseResponses = () => ({
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
  it("baseline when no live signals", () => {
    expect(computePollIntervalMs(null)).toBe(POLL_BASELINE_MS);
  });

  it("fast when liveGames > 0", () => {
    expect(
      computePollIntervalMs({
        liveGames: [{} as never],
        unmatchedLiveScores: [],
        secondsUntilNextKickoff: 9999,
      })
    ).toBe(POLL_LIVE_MS);
  });

  it("fast when next kickoff is within 60s", () => {
    expect(
      computePollIntervalMs({
        liveGames: [],
        unmatchedLiveScores: [],
        secondsUntilNextKickoff: 30,
      })
    ).toBe(POLL_LIVE_MS);
  });

  it("baseline when next kickoff far away", () => {
    expect(
      computePollIntervalMs({
        liveGames: [],
        unmatchedLiveScores: [],
        secondsUntilNextKickoff: 3600,
      })
    ).toBe(POLL_BASELINE_MS);
  });

  it("baseline when secondsUntilNextKickoff is null and no live games", () => {
    expect(
      shouldPollFast({
        liveGames: [],
        unmatchedLiveScores: [],
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

  it("performs an initial fetch of all five endpoints", async () => {
    const responses = baseResponses();
    const fetchMock = vi.fn(async (url: string) => {
      const path = url.split("?")[0];
      const body = responses[path as keyof typeof responses] ?? null;
      return { ok: true, json: async () => body } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useDashboardData("user-1", baselineSignals));

    await vi.waitFor(() => {
      const seen = new Set(
        fetchMock.mock.calls.map((c) => (c[0] as string).split("?")[0])
      );
      expect(seen.size).toBe(5);
    });
  });

  it("never calls /api/dashboard/live", async () => {
    const responses = baseResponses();
    const fetchMock = vi.fn(async (url: string) => {
      const path = url.split("?")[0];
      const body = responses[path as keyof typeof responses] ?? null;
      return { ok: true, json: async () => body } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useDashboardData("u1", baselineSignals));

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const paths = fetchMock.mock.calls.map((c) => (c[0] as string).split("?")[0]);
    expect(paths).not.toContain("/api/dashboard/live");
  });

  it("does not call my-status when no userId is provided", async () => {
    const responses = baseResponses();
    const fetchMock = vi.fn(async (url: string) => {
      const path = url.split("?")[0];
      const body = responses[path as keyof typeof responses] ?? null;
      return { ok: true, json: async () => body } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useDashboardData(undefined, baselineSignals));

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const paths = fetchMock.mock.calls.map((c) => (c[0] as string).split("?")[0]);
    expect(paths).not.toContain("/api/dashboard/my-status");
  });

  it("calls fast and slow endpoints on mount in distinct groups", async () => {
    const responses = baseResponses();
    const fetchMock = vi.fn(async (url: string) => {
      const path = url.split("?")[0];
      const body = responses[path as keyof typeof responses] ?? null;
      return { ok: true, json: async () => body } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useDashboardData("u1", baselineSignals));

    await vi.waitFor(() => {
      const seen = new Set(
        fetchMock.mock.calls.map((c) => (c[0] as string).split("?")[0])
      );
      expect(seen.size).toBe(5);
    });

    const paths = fetchMock.mock.calls.map((c) => (c[0] as string).split("?")[0]);
    // Fast group: ranking-top, my-status
    expect(paths).toContain("/api/dashboard/ranking-top");
    expect(paths).toContain("/api/dashboard/my-status");
    // Slow group: upcoming, recent, group-leaders
    expect(paths).toContain("/api/dashboard/upcoming");
    expect(paths).toContain("/api/dashboard/recent");
    expect(paths).toContain("/api/dashboard/group-leaders");
  });

  it("slow group refetches when the tab regains focus", async () => {
    const responses = baseResponses();
    const fetchMock = vi.fn(async (url: string) => {
      const path = url.split("?")[0];
      const body = responses[path as keyof typeof responses] ?? null;
      return { ok: true, json: async () => body } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useDashboardData("u1", baselineSignals));

    await vi.waitFor(() => {
      const seen = new Set(
        fetchMock.mock.calls.map((c) => (c[0] as string).split("?")[0])
      );
      expect(seen.size).toBe(5);
    });

    const upcomingBefore = fetchMock.mock.calls.filter((c) =>
      (c[0] as string).startsWith("/api/dashboard/upcoming")
    ).length;

    // Simulate tab focus return — visibilitychange to "visible".
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    await vi.waitFor(() => {
      const upcomingAfter = fetchMock.mock.calls.filter((c) =>
        (c[0] as string).startsWith("/api/dashboard/upcoming")
      ).length;
      expect(upcomingAfter).toBeGreaterThan(upcomingBefore);
    });
  });
});
