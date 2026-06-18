"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Prediction } from "@/types/prediction";
import { Game } from "@/types/game";
import {
  findLiveScoreForGame,
  LiveScoreMatch,
  useLiveScores,
} from "@/hooks/useLiveScores";
import { deriveLiveSignals } from "@/lib/liveSignals";
import {
  getMostRecentFinishedGame,
  getNextMatchDayGames,
} from "@/lib/liveGames";
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

  const liveOnlyVisible =
    liveSignals.liveGames.length > 0 ||
    liveSignals.unmatchedLiveScores.length > 0;

  // Hero list rules (cap = 2):
  //  - Live game(s) running → keep all live cards (cap doesn't apply;
  //    the live UI is the priority).
  //  - No live game → derive ONE finished + ONE upcoming card from the
  //    LOCAL games list (official_score for FINISHED, soonest future
  //    kickoff for UPCOMING). This means once `allGames` is loaded the
  //    section doesn't re-render every poll tick when nothing is live.
  //  - While `allGames` is still loading (cold first paint), reach
  //    into the dashboard server payloads — `data.recent` for the
  //    finished card, `data.upcoming` for the upcoming card — so
  //    first paint matches the eventual local-derived state instead
  //    of flashing "two upcoming → finished+upcoming" on hydration.
  //  - Nothing finished within the grace window AND nothing live →
  //    fall through to the NextGameBanner (2 upcoming).
  const upcomingPool =
    allGames.length > 0 ? allGames : data.upcoming?.games ?? [];
  const recentFromPayload = data.recent?.items?.[0]?.game ?? null;
  const heroFinishedGame = liveOnlyVisible
    ? null
    : getMostRecentFinishedGame(allGames) ??
      (allGames.length === 0 && recentFromPayload
        ? // Apply the same grace cutoff so we don't flash a stale
          // recent-result on the dashboard before /api/dashboard/recent
          // catches up (its TTL is 2 min).
          (getMostRecentFinishedGame([recentFromPayload]) ?? null)
        : null);
  const heroUpcomingGame = heroFinishedGame
    ? getNextMatchDayGames(upcomingPool, 1)[0] ?? null
    : null;

  const liveCardVisible =
    liveOnlyVisible || heroFinishedGame !== null;

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
