"use client";

import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { selectHero } from "@/lib/heroSelection";
import { DashboardLiveCard } from "@/components/sections/dashboard/DashboardLiveCard";
import { NextGameBanner } from "@/components/ui/NextGameBanner";

interface PalpitesHeroProps {
  games: Game[];
  predictions: Prediction[];
  currentUserId: string;
}

const EMPTY_LIVE_SIGNALS = {
  liveGames: [],
  unmatchedLiveScores: [],
  secondsUntilNextKickoff: null,
};

/**
 * Mirrors the dashboard hero (DashboardSection top section) but with
 * live behaviors stripped — no live card, no goal animation, no
 * unmatched-upstream fallback. Powered by the shared `selectHero`
 * resolver so both screens always agree on which game(s) to show.
 *
 * Cap parity with the dashboard: 2 cards in the upcoming-only branch
 * (was Infinity before this refactor).
 */
export function PalpitesHero({
  games,
  predictions,
  currentUserId,
}: PalpitesHeroProps) {
  const hero = selectHero(games, EMPTY_LIVE_SIGNALS, {
    mode: "no-live",
    upcomingFallbackLimit: 2,
  });

  if (hero.kind === "finished+upcoming") {
    return (
      <DashboardLiveCard
        liveGames={[]}
        recentlyFinishedGames={[hero.finished]}
        upcomingGame={hero.upcoming}
        liveScores={[]}
        myPredictions={predictions}
        currentUserId={currentUserId}
      />
    );
  }

  if (hero.kind === "upcoming-only") {
    return (
      <NextGameBanner
        games={games}
        predictions={predictions}
        currentUserId={currentUserId}
        limit={2}
      />
    );
  }

  return null;
}
