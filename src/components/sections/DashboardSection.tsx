"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Prediction } from "@/types/prediction";
import { Game } from "@/types/game";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";
import { buildDisplayKnockoutMatches } from "@/lib/knockoutDisplayMatches";
import {
  pickCurrentKnockoutRound,
  pickNextKnockoutRound,
} from "@/lib/knockoutRounds";
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
import { KnockoutBracketPreview } from "./dashboard/KnockoutNextRoundCard";
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
  knockoutPredictions?: KnockoutPrediction[];
  knockoutMatches?: KnockoutMatchRecord[];
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
  knockoutMatches = [],
  games,
  onNavigate,
}: DashboardSectionProps) {
  const allGames = useMemo(() => games ?? [], [games]);
  const baseLiveScores = useLiveScores(allGames);

const baseLiveSignals = useMemo(
  () => deriveLiveSignals(allGames, baseLiveScores),
  [allGames, baseLiveScores]
);

const data = useDashboardData(currentUserId, baseLiveSignals);

  const heroPool = useMemo(() => {
  const recentFromPayload = data.recent?.items?.[0]?.game ?? null;
  const upcomingFromPayload = data.upcoming?.games ?? [];

  const byId = new Map<string, Game>();

  for (const game of allGames) {
    byId.set(game.id, game);
  }

  for (const game of upcomingFromPayload) {
    byId.set(game.id, game);
  }

  if (recentFromPayload) {
    byId.set(recentFromPayload.id, recentFromPayload);
  }

  return Array.from(byId.values());
}, [allGames, data.recent, data.upcoming]);

const liveScores = useLiveScores(heroPool);

const liveSignals = useMemo(
  () => deriveLiveSignals(heroPool, liveScores),
  [heroPool, liveScores]
);

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

  const knockoutsStarted = useMemo(
    () => knockoutMatches.some((match) => match.winner_team !== null),
    [knockoutMatches]
  );

  const currentKnockoutRound = useMemo(
    () => (knockoutsStarted ? pickCurrentKnockoutRound(knockoutMatches) : null),
    [knockoutsStarted, knockoutMatches]
  );

  const nextKnockoutRound = useMemo(
    () => (knockoutsStarted ? pickNextKnockoutRound(knockoutMatches) : null),
    [knockoutsStarted, knockoutMatches]
  );

  const displayKnockoutMatches = useMemo(
    () =>
      knockoutsStarted
        ? buildDisplayKnockoutMatches(knockoutMatches, allGames)
        : [],
    [knockoutsStarted, knockoutMatches, allGames]
  );

  const currentRoundMatches = useMemo(
    () =>
      currentKnockoutRound
        ? displayKnockoutMatches.filter((m) => m.round === currentKnockoutRound)
        : [],
    [displayKnockoutMatches, currentKnockoutRound]
  );

  const nextRoundMatches = useMemo(
    () =>
      nextKnockoutRound
        ? displayKnockoutMatches.filter((m) => m.round === nextKnockoutRound)
        : [],
    [displayKnockoutMatches, nextKnockoutRound]
  );

  const showBracketPreview =
    knockoutsStarted && (currentKnockoutRound || nextKnockoutRound);

  const [goalTrigger, setGoalTrigger] = useState<string | null>(null);
  const [scoringTeam, setScoringTeam] = useState<string | null>(null);
  const lastSnapshotRef = useRef<Map<string, TeamScore> | null>(null);
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const next = snapshotScores(liveSignals.liveGames, liveScores);
    const prev = lastSnapshotRef.current;

    lastSnapshotRef.current = next;

    if (prev === null) return;

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
          recentlyFinishedGames={heroFinishedGame ? [heroFinishedGame] : []}
          upcomingGame={heroUpcomingGame}
          liveScores={liveScores}
          unmatchedLiveScores={liveSignals.unmatchedLiveScores}
          myPredictions={myPredictions}
          knockoutPredictions={knockoutPredictions}
          currentUserId={currentUserId}
          onRefresh={data.refetch}
        />
      ) : (
        <NextGameBanner
          games={upcomingPool}
          predictions={myPredictions ?? []}
          knockoutPredictions={knockoutPredictions}
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

      {showBracketPreview ? (
        <KnockoutBracketPreview
          currentRound={currentKnockoutRound}
          currentMatches={currentRoundMatches}
          nextRound={nextKnockoutRound}
          nextMatches={nextRoundMatches}
        />
      ) : (
        <GroupLeadersCard
          groups={data.groupLeaders?.groups ?? []}
          onSeeAll={() => onNavigate("/classificacao")}
        />
      )}
    </div>
  );
}