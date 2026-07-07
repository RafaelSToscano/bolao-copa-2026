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
import { fetchJson } from "@/lib/fetchJson";

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

/**
 * Fetches the dashboard endpoints without polling. With 60-min server
 * TTLs (invalidated by admin-write eviction) plus a live-scores feed
 * that updates independently, timer-based polling adds no signal —
 * it only spins the edge cache.
 *
 * Refetch triggers:
 *  - Fast group (ranking-top, my-status): on mount and whenever a
 *    live-score signal actually changes (goal scored, a match goes
 *    live, or a match finishes). `deriveLiveSignals` output is stable
 *    across ticks with no score change, so a shallow-compare on the
 *    signal shape suffices.
 *  - Slow group (upcoming, recent, group-leaders): on mount and on
 *    tab visibility regain.
 *  - `refetch()`: refreshes both, e.g. after a mock-goal bump.
 */
export function useDashboardData(
  currentUserId: string | undefined,
  liveSignals: LiveSignals
) {
  const [data, setData] = useState<DashboardData>(initialState);

  const fetchFast = useCallback(async () => {
    const userParam = currentUserId
      ? `?userId=${encodeURIComponent(currentUserId)}`
      : "";

    const [rankingTop, myStatus] = await Promise.all([
      fetchJson<DashboardRankingTopPayload>(
        `/api/dashboard/ranking-top${userParam}`
      ),
      currentUserId
        ? fetchJson<DashboardMyStatusPayload>(
            `/api/dashboard/my-status${userParam}`
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

  // Guard against overlapping refetches. A live-signal change that
  // fires while a manual refetch (e.g. mock-goal bump) is in flight
  // would race the goal-detection effect's snapshot comparison and
  // lose a goal. Queue exactly one follow-up so a coinciding trigger
  // isn't silently dropped.
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

  // Fast group refetches when the live signal changes shape:
  // - liveGames count/ids change (a match went live or finished)
  // - unmatched score ids change (upstream saw a fixture we don't map)
  // - any live score value on a mapped game shifted (goal)
  //
  // The goal-detection lives in DashboardSection already, so here we
  // only need to know whether the fingerprint moved.
  const signalFingerprint = fingerprintLiveSignals(liveSignals);

  useEffect(() => {
    let cancelled = false;

    const runFast = async () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      await fetchFast();
    };

    void runFast();
    return () => {
      cancelled = true;
    };
  }, [fetchFast, signalFingerprint]);

  useEffect(() => {
    let cancelled = false;

    const runSlow = async () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      await fetchSlow();
    };

    void runSlow();

    const onVisibility = () => {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "visible") {
        void fetchSlow();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      cancelled = true;
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }, [fetchSlow]);

  return { ...data, refetch: safeRefetch };
}

function fingerprintLiveSignals(signals: LiveSignals): string {
  // liveGames only carry the DB-side Game shape (no score), so score
  // changes on mapped games are captured via unmatchedLiveScores'
  // sibling set. DashboardSection derives liveSignals from the raw
  // liveScores list, which includes every live match — including the
  // ones that DID match a Game. That means score movements on mapped
  // games surface as changes to `liveGames.length` transitions
  // (kickoff/finish) but NOT for mid-match goals.
  //
  // For mid-match goal refetches we depend on the caller's manual
  // `refetch()` from the goal-detection effect in DashboardSection.
  const liveIds = signals.liveGames.map((g) => g.id).sort().join(",");
  const unmatchedIds = signals.unmatchedLiveScores
    .map((m) => `${m.id}:${m.homeScore}-${m.awayScore}`)
    .sort()
    .join(",");
  return `${liveIds}|${unmatchedIds}`;
}
