"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DashboardGroupLeadersPayload,
  DashboardMyStatusPayload,
  DashboardRankingTopPayload,
  DashboardRecentPayload,
  DashboardUpcomingPayload,
} from "@/types/dashboard";
import { LiveSignals } from "@/lib/liveSignals";

export const POLL_LIVE_MS = 10_000;
export const POLL_BASELINE_MS = 60_000;
export const FAST_KICKOFF_THRESHOLD_SEC = 60;

export function shouldPollFast(signals: LiveSignals | null): boolean {
  if (!signals) return false;
  if (signals.liveGames.length > 0) return true;
  if (
    signals.secondsUntilNextKickoff !== null &&
    signals.secondsUntilNextKickoff <= FAST_KICKOFF_THRESHOLD_SEC
  ) {
    return true;
  }
  return false;
}

export function computePollIntervalMs(signals: LiveSignals | null): number {
  return shouldPollFast(signals) ? POLL_LIVE_MS : POLL_BASELINE_MS;
}

export interface DashboardData {
  rankingTop: DashboardRankingTopPayload | null;
  upcoming: DashboardUpcomingPayload | null;
  recent: DashboardRecentPayload | null;
  myStatus: DashboardMyStatusPayload | null;
  groupLeaders: DashboardGroupLeadersPayload | null;
  lastUpdated: number | null;
  error: string | null;
}

const initialState: DashboardData = {
  rankingTop: null,
  upcoming: null,
  recent: null,
  myStatus: null,
  groupLeaders: null,
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
 * - Fast group (timer-driven, 10s when a live signal says so / 60s
 *   otherwise): `/api/dashboard/{ranking-top,my-status}` — payloads
 *   that move with live scores. The "is anything live / when's the
 *   next kickoff" signal is read from the football-data feed via
 *   `useLiveScores` instead of a dedicated server route.
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
export function useDashboardData(
  currentUserId: string | undefined,
  liveSignals: LiveSignals
) {
  const [data, setData] = useState<DashboardData>(initialState);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchFast = useCallback(async () => {
    const [rankingTop, myStatus] = await Promise.all([
      fetchJson<DashboardRankingTopPayload>("/api/dashboard/ranking-top"),
      currentUserId
        ? fetchJson<DashboardMyStatusPayload>(
            `/api/dashboard/my-status?userId=${encodeURIComponent(currentUserId)}`
          )
        : Promise.resolve(null),
    ]);

    setData((prev) => ({
      ...prev,
      rankingTop,
      myStatus,
      lastUpdated: Date.now(),
      error: null,
    }));
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

  // Always read the latest liveSignals inside the timer tick so the
  // poll cadence reacts to upstream score/kick-off updates without
  // tearing down and rebuilding the timer effect on every change.
  const liveSignalsRef = useRef(liveSignals);
  liveSignalsRef.current = liveSignals;

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      await fetchFast();
      if (cancelled) return;
      const interval = shouldPollFast(liveSignalsRef.current)
        ? POLL_LIVE_MS
        : POLL_BASELINE_MS;
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
