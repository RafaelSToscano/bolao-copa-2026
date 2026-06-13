"use client";

import { useEffect, useRef, useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Prediction } from "@/types/prediction";
import { Game } from "@/types/game";
import {
  findLiveScoreForGame,
  LiveScoreMatch,
  useLiveScores,
} from "@/hooks/useLiveScores";
import { DashboardLiveCard } from "./dashboard/DashboardLiveCard";
import { NextGameBanner } from "@/components/ui/NextGameBanner";
import { RankingTopFive } from "./dashboard/RankingTopFive";
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
  const data = useDashboardData(currentUserId);
  // Use the same client-side polling hook the Palpites banner uses,
  // rather than the server-cached `data.live.liveScores` snapshot. The
  // server path was sometimes returning empty/stale scores in
  // production while the same upstream worked fine through this hook.
  const liveScores = useLiveScores(data.live?.liveGames ?? []);

  const [goalTrigger, setGoalTrigger] = useState<string | null>(null);
  const [scoringTeam, setScoringTeam] = useState<string | null>(null);
  const lastSnapshotRef = useRef<Map<string, TeamScore> | null>(null);
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drop the deferred modal timer when the component unmounts. We
  // intentionally do NOT clear it on every `data.live` change — a
  // fresh poll arriving inside the 2.2s animation window must not
  // cancel the pending modal-open call, otherwise the modal silently
  // goes missing whenever a refetch lands quickly after a goal.
  useEffect(() => {
    return () => {
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!data.live) return;
    const next = snapshotScores(data.live.liveGames, liveScores);
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
  }, [data.live, liveScores]);

  return (
    <div className="space-y-6">
      <GoalAnimation trigger={goalTrigger} />
      <GoalScorerModal team={scoringTeam} onClose={() => setScoringTeam(null)} />

      <div>
        <h1 className="text-3xl font-black">Dashboard</h1>
        <p className="text-slate-400 text-base">
          Visão geral do bolão — ao vivo, ranking, próximos jogos e seus
          resultados.
        </p>
      </div>

      {data.live && data.live.liveGames.length > 0 ? (
        <DashboardLiveCard
          liveGames={data.live.liveGames}
          liveScores={liveScores}
          myPredictions={myPredictions}
          currentUserId={currentUserId}
          onRefresh={data.refetch}
        />
      ) : (
        <NextGameBanner
          games={games ?? data.upcoming?.games ?? []}
          predictions={myPredictions ?? []}
          currentUserId={currentUserId}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <RankingTopFive
            top={data.rankingTop?.top ?? []}
            lanterna={data.rankingTop?.lanterna ?? null}
            provisional={data.rankingTop?.provisional ?? false}
            onSeeAll={() => onNavigate("/ranking")}
          />

          <MyStatusCard
            myStatus={data.myStatus}
            onSeeAll={() => onNavigate("/palpites")}
          />
        </div>

        <div className="space-y-6">
          <UpcomingMatchesCard games={data.upcoming?.games ?? []} />

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
