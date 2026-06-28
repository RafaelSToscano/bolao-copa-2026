"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Prediction } from "@/types/prediction";
import { KnockoutPrediction } from "@/types/knockout";
import { Game } from "@/types/game";
import {
  findLiveScoreForGame,
  LiveScoreMatch,
  useLiveScores,
} from "@/hooks/useLiveScores";
import { deriveLiveSignals } from "@/lib/liveSignals";
import { selectHero } from "@/lib/heroSelection";
import { DashboardLiveCard } from "./dashboard/DashboardLiveCard";
import { NextGameBanner } from "@/components/ui/NextGameBanner";
import { RankingTopTen } from "./dashboard/RankingTopTen";
import { UpcomingMatchesCard } from "./dashboard/UpcomingMatchesCard";
import { RecentResultsCard } from "./dashboard/RecentResultsCard";
import { MyStatusCard } from "./dashboard/MyStatusCard";
import { GroupLeadersCard } from "./dashboard/GroupLeadersCard";
import { GoalAnimation } from "./dashboard/GoalAnimation";
import { GoalScorerModal } from "./dashboard/GoalScorerModal";

const MODAL_DELAY_MS = 2200;

export type DashboardNavigationTarget =
  | "/palpites"
  | "/classificacao"
  | "/mata-mata"
  | "/ranking";

interface DashboardSectionProps {
  currentUserId: string;
  myPredictions?: Prediction[];
  // Full client-side games list, same source Palpites uses. Lets the
  // "Próximos Jogos" cards on the dashboard pick from the exact same
  // pool as Palpites instead of the cached, pre-filtered server
  // payload, so the two screens always agree on which games come next.
  knockoutPredictions?: KnockoutPrediction[];
  games?: Game[];
  onNavigate: (target: DashboardNavigationTarget) => void;
}

interface TeamScore {
  home: number;
  away: number;
  teamA: string;
  teamB: string;
}

function snapshotScores(
  liveGames: Game[],
  liveScores: LiveScoreMatch[]
): Map<string, TeamScore> {
  const m = new Map<string, TeamScore>();
  for (const g of liveGames) {
    const ls = findLiveScoreForGame(g, liveScores);
    if (!ls || ls.homeScore == null || ls.awayScore == null) continue;
    m.set(g.id, {
      home: ls.homeScore,
      away: ls.awayScore,
      teamA: g.team_a,
      teamB: g.team_b,
    });
  }
  return m;
}

/**
 * Returns the team that just scored, if exactly one team's score went
 * up since the prior snapshot. Returns null on the first observation,
 * on no change, or on multi-goal diffs (which we treat as initial sync).
 */
function detectScoringTeam(
  prev: Map<string, TeamScore>,
  next: Map<string, TeamScore>
): string | null {
  if (prev.size === 0) return null;
  for (const [gameId, curr] of next) {
    const before = prev.get(gameId);
    if (!before) continue;
    if (curr.home > before.home && curr.away === before.away) return curr.teamA;
    if (curr.away > before.away && curr.home === before.home) return curr.teamB;
  }
  return null;
}

export function DashboardSection({
  currentUserId,
  myPredictions,
  knockoutPredictions = [],
  games,
  onNavigate,
}: DashboardSectionProps) {
  const allGames = useMemo(() => games ?? [], [games]);
  const liveScores = useLiveScores(allGames);

  const liveSignals = useMemo(
    () => deriveLiveSignals(allGames, liveScores),
    [allGames, liveScores]
  );

  const data = useDashboardData(currentUserId, liveSignals);

  // Cold-paint fallback: while `allGames` is still loading, splice the
  // server payloads into the games pool so selectHero sees the same
  // shape it'll see post-hydration. Without this, first paint flashes
  // "2 upcoming" before settling on "finished + upcoming" once allGames
  // arrives. The same grace cutoff in getMostRecentFinishedGame keeps
  // /api/dashboard/recent from showing stale results past its TTL.
  const heroPool = useMemo(() => {
    if (allGames.length > 0) return allGames;
    const recentFromPayload = data.recent?.items?.[0]?.game ?? null;
    const upcomingFromPayload = data.upcoming?.games ?? [];
    return recentFromPayload
      ? [recentFromPayload, ...upcomingFromPayload]
      : upcomingFromPayload;
  }, [allGames, data.recent, data.upcoming]);

  const hero = useMemo(
    () =>
      selectHero(heroPool, liveSignals, {
        mode: "with-live",
        upcomingFallbackLimit: 2,
      }),
    [heroPool, liveSignals]
  );

  const liveCardVisible = hero.kind !== "upcoming-only";
  const heroFinishedGame =
    hero.kind === "finished+upcoming" ? hero.finished : null;
  const heroUpcomingGame =
    hero.kind === "finished+upcoming" ? hero.upcoming : null;
  const upcomingPool =
    hero.kind === "upcoming-only" ? hero.games : heroPool;

  const [goalTrigger, setGoalTrigger] = useState<string | null>(null);
  const [scoringTeam, setScoringTeam] = useState<string | null>(null);
  const lastSnapshotRef = useRef<Map<string, TeamScore> | null>(null);
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drop the deferred modal timer when the component unmounts. We
  // intentionally do NOT clear it on every snapshot change — a fresh
  // poll arriving inside the 2.2s animation window must not cancel
  // the pending modal-open call, otherwise the modal silently goes
  // missing whenever a refetch lands quickly after a goal.
  useEffect(() => {
    return () => {
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const next = snapshotScores(liveSignals.liveGames, liveScores);
    const prev = lastSnapshotRef.current;
    lastSnapshotRef.current = next;
    if (prev === null) return; // first observation — establish baseline only

    const team = detectScoringTeam(prev, next);
    if (!team) return;

    setGoalTrigger(team + ":" + Date.now());
    if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    modalTimerRef.current = setTimeout(() => {
      setScoringTeam(team);
      modalTimerRef.current = null;
    }, MODAL_DELAY_MS);
  }, [liveSignals, liveScores]);

  return (
    <div className="space-y-6">
      <GoalAnimation trigger={goalTrigger} />
      <GoalScorerModal team={scoringTeam} onClose={() => setScoringTeam(null)} />

      {liveCardVisible ? (
        <DashboardLiveCard
          liveGames={liveSignals.liveGames}
          recentlyFinishedGames={
            heroFinishedGame ? [heroFinishedGame] : []
          }
          upcomingGame={heroUpcomingGame}
          liveScores={liveScores}
          unmatchedLiveScores={liveSignals.unmatchedLiveScores}
          myPredictions={myPredictions}
          currentUserId={currentUserId}
          onRefresh={data.refetch}
        />
      ) : (
        <NextGameBanner
          games={upcomingPool}
          predictions={myPredictions ?? []}
          currentUserId={currentUserId}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
            <RankingTopTen
            top={data.rankingTop?.top ?? []}
            lanterna={data.rankingTop?.lanterna ?? null}
            relegationZone={data.rankingTop?.relegationZone ?? []}
            provisional={data.rankingTop?.provisional ?? false}
            onSeeAll={() => onNavigate("/ranking")}
            />

          <MyStatusCard
            myStatus={data.myStatus}
            onSeeAll={() => onNavigate("/palpites")}
          />
        </div>

        <div className="space-y-6">
          <UpcomingMatchesCard
            games={data.upcoming?.games ?? []}
            predictions={myPredictions ?? []}
            knockoutPredictions={knockoutPredictions}
            currentUserId={currentUserId}
          />

          <RecentResultsCard items={data.recent?.items ?? []} />
        </div>
      </div>

      <GroupLeadersCard
        groups={data.groupLeaders?.groups ?? []}
        onSeeAll={() => onNavigate("/classificacao")}
      />
    </div>
  );
}
