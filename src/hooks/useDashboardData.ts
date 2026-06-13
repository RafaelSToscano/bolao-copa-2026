"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DashboardGroupLeadersPayload,
  DashboardLivePayload,
  DashboardMyStatusPayload,
  DashboardRankingTopPayload,
  DashboardRecentPayload,
  DashboardUpcomingPayload,
} from "@/types/dashboard";

export const POLL_LIVE_MS = 10_000;
export const POLL_BASELINE_MS = 60_000;
export const FAST_KICKOFF_THRESHOLD_SEC = 60;

export function shouldPollFast(live: DashboardLivePayload | null): boolean {
  if (!live) return false;
  if (live.liveGames.length > 0) return true;
  if (
    live.secondsUntilNextKickoff !== null &&
    live.secondsUntilNextKickoff <= FAST_KICKOFF_THRESHOLD_SEC
  ) {
    return true;
  }
  return false;
}

export function computePollIntervalMs(
  live: DashboardLivePayload | null
): number {
  return shouldPollFast(live) ? POLL_LIVE_MS : POLL_BASELINE_MS;
}

export interface DashboardData {
  live: DashboardLivePayload | null;
  rankingTop: DashboardRankingTopPayload | null;
  upcoming: DashboardUpcomingPayload | null;
  recent: DashboardRecentPayload | null;
  myStatus: DashboardMyStatusPayload | null;
  groupLeaders: DashboardGroupLeadersPayload | null;
  isLive: boolean;
  lastUpdated: number | null;
  error: string | null;
}

const initialState: DashboardData = {
  live: null,
  rankingTop: null,
  upcoming: null,
  recent: null,
  myStatus: null,
  groupLeaders: null,
  isLive: false,
  lastUpdated: null,
  error: null,
};

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "default" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Polls the dashboard endpoints in two cadences:
 *
 * - Fast group (timer-driven, 10s during a live match / 60s otherwise):
 *   `/api/dashboard/{live,ranking-top,my-status}` — payloads that
 *   move with live scores.
 *
 * - Slow group (event-driven, no timer): `/api/dashboard/{upcoming,
 *   recent,group-leaders}` — payloads that only change when a kickoff
 *   passes or the admin records an official score. Refetched on
 *   mount and whenever the tab regains focus, so a user returning to
 *   the dashboard after a long break sees fresh data.
 *
 * `refetch()` (e.g. after a mock-goal bump) refreshes BOTH groups so
 * manual refresh is always whole.
 */
export function useDashboardData(currentUserId: string | undefined) {
  const [data, setData] = useState<DashboardData>(initialState);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchFast = useCallback(async (): Promise<DashboardLivePayload | null> => {
    const [live, rankingTop, myStatus] = await Promise.all([
      fetchJson<DashboardLivePayload>("/api/dashboard/live"),
      fetchJson<DashboardRankingTopPayload>("/api/dashboard/ranking-top"),
      currentUserId
        ? fetchJson<DashboardMyStatusPayload>(
            `/api/dashboard/my-status?userId=${encodeURIComponent(currentUserId)}`
          )
        : Promise.resolve(null),
    ]);

    setData((prev) => ({
      ...prev,
      live,
      rankingTop,
      myStatus,
      isLive: !!live && live.liveGames.length > 0,
      lastUpdated: Date.now(),
      error: null,
    }));

    return live;
  }, [currentUserId]);

  const fetchSlow = useCallback(async () => {
    const userParam = currentUserId
      ? `?userId=${encodeURIComponent(currentUserId)}`
      : "";

    const [upcoming, recent, groupLeaders] = await Promise.all([
      fetchJson<DashboardUpcomingPayload>("/api/dashboard/upcoming"),
      fetchJson<DashboardRecentPayload>(`/api/dashboard/recent${userParam}`),
      fetchJson<DashboardGroupLeadersPayload>("/api/dashboard/group-leaders"),
    ]);

    setData((prev) => ({
      ...prev,
      upcoming,
      recent,
      groupLeaders,
    }));
  }, [currentUserId]);

  // Guard against overlapping refetches. A timer tick that fires
  // while a manual refetch (e.g. mock-goal bump) is in flight would
  // race the goal-detection effect's snapshot comparison and lose a
  // goal. Queue exactly one follow-up so a coinciding click isn't
  // silently dropped.
  const fetchInFlightRef = useRef(false);
  const fetchQueuedRef = useRef(false);

  const safeRefetch = useCallback(async () => {
    if (fetchInFlightRef.current) {
      fetchQueuedRef.current = true;
      return;
    }
    fetchInFlightRef.current = true;
    try {
      await Promise.all([fetchFast(), fetchSlow()]);
      while (fetchQueuedRef.current) {
        fetchQueuedRef.current = false;
        await Promise.all([fetchFast(), fetchSlow()]);
      }
    } finally {
      fetchInFlightRef.current = false;
    }
  }, [fetchFast, fetchSlow]);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      // Use the fresh payload returned by fetchFast() rather than
      // a state ref — state lags by a render commit and would force
      // the FIRST tick to schedule a 60s baseline even when the
      // response already says we're live.
      const fresh = await fetchFast();
      if (cancelled) return;
      const interval = shouldPollFast(fresh) ? POLL_LIVE_MS : POLL_BASELINE_MS;
      timerRef.current = setTimeout(tick, interval);
    };

    // Slow group runs once on mount alongside the first fast tick;
    // after that it only refires when the tab regains focus.
    const initialKick = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      await Promise.all([fetchSlow(), tick()]);
    };
    void initialKick();

    const onVisibility = () => {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "visible") {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        void fetchSlow();
        void tick();
      } else if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }, [fetchFast, fetchSlow]);

  return { ...data, refetch: safeRefetch };
}
