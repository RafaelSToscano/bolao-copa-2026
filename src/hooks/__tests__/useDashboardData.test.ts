import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { LiveSignals } from "@/lib/liveSignals";
import { Game } from "@/types/game";
import { LiveScoreMatch } from "@/hooks/useLiveScores";

const baselineSignals: LiveSignals = {
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

function stubFetch() {
  const responses = baseResponses();
  const fetchMock = vi.fn(async (...args: unknown[]) => {
    const url = String(args[0] ?? "");
    const path = url.split("?")[0];
    const body = responses[path as keyof typeof responses] ?? null;
    return { ok: true, json: async () => body } as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("useDashboardData", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("performs an initial fetch of all five endpoints", async () => {
    const fetchMock = stubFetch();

    renderHook(() => useDashboardData("user-1", baselineSignals));

    await vi.waitFor(() => {
      const seen = new Set(
        fetchMock.mock.calls.map((c) => String(c[0] ?? "").split("?")[0])
      );
      expect(seen.size).toBe(5);
    });
  });

  it("never calls /api/dashboard/live", async () => {
    const fetchMock = stubFetch();
    renderHook(() => useDashboardData("u1", baselineSignals));

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const paths = fetchMock.mock.calls.map((c) => String(c[0] ?? "").split("?")[0]);
    expect(paths).not.toContain("/api/dashboard/live");
  });

  it("forwards userId on ranking-top so the server can attach the user's row", async () => {
    const fetchMock = stubFetch();
    renderHook(() => useDashboardData("user-42", baselineSignals));

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const rankingCalls = fetchMock.mock.calls
      .map((c) => String(c[0] ?? ""))
      .filter((url) => url.startsWith("/api/dashboard/ranking-top"));
    expect(rankingCalls.length).toBeGreaterThan(0);
    expect(rankingCalls.every((url) => url.includes("userId=user-42"))).toBe(true);
  });

  it("does not call my-status when no userId is provided", async () => {
    const fetchMock = stubFetch();
    renderHook(() => useDashboardData(undefined, baselineSignals));

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const paths = fetchMock.mock.calls.map((c) => String(c[0] ?? "").split("?")[0]);
    expect(paths).not.toContain("/api/dashboard/my-status");
  });

  it("slow group refetches when the tab regains focus", async () => {
    const fetchMock = stubFetch();
    renderHook(() => useDashboardData("u1", baselineSignals));

    await vi.waitFor(() => {
      const seen = new Set(
        fetchMock.mock.calls.map((c) => String(c[0] ?? "").split("?")[0])
      );
      expect(seen.size).toBe(5);
    });

    const upcomingBefore = fetchMock.mock.calls.filter((c) =>
      String(c[0] ?? "").startsWith("/api/dashboard/upcoming")
    ).length;

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    await vi.waitFor(() => {
      const upcomingAfter = fetchMock.mock.calls.filter((c) =>
        String(c[0] ?? "").startsWith("/api/dashboard/upcoming")
      ).length;
      expect(upcomingAfter).toBeGreaterThan(upcomingBefore);
    });
  });

  it("fast group refetches when the live-signal fingerprint changes", async () => {
    const fetchMock = stubFetch();

    const initial: LiveSignals = { ...baselineSignals };

    const { rerender } = renderHook(
      (signals: LiveSignals) => useDashboardData("u1", signals),
      { initialProps: initial }
    );

    await vi.waitFor(() => {
      expect(
        fetchMock.mock.calls.filter((c) =>
          String(c[0] ?? "").startsWith("/api/dashboard/ranking-top")
        ).length
      ).toBeGreaterThan(0);
    });

    const rankingBefore = fetchMock.mock.calls.filter((c) =>
      String(c[0] ?? "").startsWith("/api/dashboard/ranking-top")
    ).length;

    const liveGame = { id: "g1" } as Game;
    const nextSignals: LiveSignals = {
      liveGames: [liveGame],
      unmatchedLiveScores: [],
      secondsUntilNextKickoff: null,
    };

    await act(async () => {
      rerender(nextSignals);
    });

    await vi.waitFor(() => {
      const rankingAfter = fetchMock.mock.calls.filter((c) =>
        String(c[0] ?? "").startsWith("/api/dashboard/ranking-top")
      ).length;
      expect(rankingAfter).toBeGreaterThan(rankingBefore);
    });
  });

  it("does NOT poll on a timer while no live signal is present", async () => {
    vi.useFakeTimers();
    const fetchMock = stubFetch();

    renderHook(() => useDashboardData("u1", baselineSignals));

    // Initial burst: 5 endpoints. Advance a full minute — no polling
    // means no extra ranking-top calls beyond the initial one.
    await vi.waitFor(() => {
      expect(
        fetchMock.mock.calls.filter((c) =>
          String(c[0] ?? "").startsWith("/api/dashboard/ranking-top")
        ).length
      ).toBeGreaterThanOrEqual(1);
    });

    const rankingAfterInitial = fetchMock.mock.calls.filter((c) =>
      String(c[0] ?? "").startsWith("/api/dashboard/ranking-top")
    ).length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000);
    });

    const rankingAfterMinute = fetchMock.mock.calls.filter((c) =>
      String(c[0] ?? "").startsWith("/api/dashboard/ranking-top")
    ).length;

    expect(rankingAfterMinute).toBe(rankingAfterInitial);
  });
});

// Type-only import guard — silence unused-import if the file evolves.
void ({} as LiveScoreMatch);
