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

export function useDashboardData(currentUserId: string | undefined) {
  const [data, setData] = useState<DashboardData>(initialState);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = useCallback(async () => {
    const userParam = currentUserId
      ? `?userId=${encodeURIComponent(currentUserId)}`
      : "";

    const [live, rankingTop, upcoming, recent, myStatus, groupLeaders] =
      await Promise.all([
        fetchJson<DashboardLivePayload>("/api/dashboard/live"),
        fetchJson<DashboardRankingTopPayload>("/api/dashboard/ranking-top"),
        fetchJson<DashboardUpcomingPayload>("/api/dashboard/upcoming"),
        fetchJson<DashboardRecentPayload>(
          `/api/dashboard/recent${userParam}`
        ),
        currentUserId
          ? fetchJson<DashboardMyStatusPayload>(
              `/api/dashboard/my-status?userId=${encodeURIComponent(currentUserId)}`
            )
          : Promise.resolve(null),
        fetchJson<DashboardGroupLeadersPayload>("/api/dashboard/group-leaders"),
      ]);

    setData({
      live,
      rankingTop,
      upcoming,
      recent,
      myStatus,
      groupLeaders,
      isLive: !!live && live.liveGames.length > 0,
      lastUpdated: Date.now(),
      error: null,
    });
  }, [currentUserId]);

  // Guard against overlapping fetches. If the polling timer fires
  // while a manual refetch (e.g. from a goal-bump click) is still in
  // flight, the second batch of fetches would race the first and the
  // goal-detection effect would observe inconsistent intermediate
  // snapshots. If a caller asks to refetch while one is already
  // running, queue exactly one follow-up so their request isn't
  // silently dropped — that fixes the case where a + click coincides
  // with a polling tick and the user sees their goal lost.
  const fetchInFlightRef = useRef(false);
  const fetchQueuedRef = useRef(false);

  const safeRefetch = useCallback(async () => {
    if (fetchInFlightRef.current) {
      fetchQueuedRef.current = true;
      return;
    }
    fetchInFlightRef.current = true;
    try {
      await refetch();
      while (fetchQueuedRef.current) {
        fetchQueuedRef.current = false;
        await refetch();
      }
    } finally {
      fetchInFlightRef.current = false;
    }
  }, [refetch]);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      await safeRefetch();
      if (cancelled) return;
      const interval = shouldPollFast(dataRef.current.live)
        ? POLL_LIVE_MS
        : POLL_BASELINE_MS;
      timerRef.current = setTimeout(tick, interval);
    };

    void tick();

    const onVisibility = () => {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "visible") {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
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
  }, [safeRefetch]);

  return { ...data, refetch: safeRefetch };
}
