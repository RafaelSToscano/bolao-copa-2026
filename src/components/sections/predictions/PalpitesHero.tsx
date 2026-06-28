"use client";

import { useMemo } from "react";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutPrediction } from "@/types/knockout";
import { selectHero } from "@/lib/heroSelection";
import { DashboardLiveCard } from "@/components/sections/dashboard/DashboardLiveCard";
import { NextGameBanner } from "@/components/ui/NextGameBanner";
import { useKnockoutPredictions } from "@/hooks/useKnockoutPredictions";
import { buildDisplayKnockoutMatches } from "@/lib/knockoutDisplayMatches";

interface PalpitesHeroProps {
  games: Game[];
  predictions: Prediction[];
  knockoutPredictions?: KnockoutPrediction[];
  currentUserId: string;
}

const EMPTY_LIVE_SIGNALS = {
  liveGames: [],
  unmatchedLiveScores: [],
  secondsUntilNextKickoff: null,
};

function knockoutMatchToGame(match: ReturnType<typeof buildDisplayKnockoutMatches>[number]): Game | null {
  if (!match.match_date || !match.display_home_team || !match.display_away_team) {
    return null;
  }

  return {
    id: `knockout-${match.id}`,
    phase: match.round,
    group_name: null,
    match_order: match.id,
    match_date: match.match_date,
    team_a: match.display_home_team,
    team_b: match.display_away_team,
    official_score_a: match.official_score_home,
    official_score_b: match.official_score_away,
    locked: match.locked,
  };
}

export function PalpitesHero({
  games,
  predictions,
  knockoutPredictions = [],
  currentUserId,
}: PalpitesHeroProps) {
  const { matches } = useKnockoutPredictions(currentUserId);

  const knockoutGames = useMemo(() => {
    return buildDisplayKnockoutMatches(matches, games)
      .filter((match) => match.round === "r32")
      .map(knockoutMatchToGame)
      .filter((game): game is Game => game !== null);
  }, [matches, games]);

  const heroGames = useMemo(() => {
    const byId = new Map<string, Game>();

    for (const game of games) {
      byId.set(game.id, game);
    }

    for (const game of knockoutGames) {
      byId.set(game.id, game);
    }

    return Array.from(byId.values());
  }, [games, knockoutGames]);

  const hero = selectHero(heroGames, EMPTY_LIVE_SIGNALS, {
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
        knockoutPredictions={knockoutPredictions}
        currentUserId={currentUserId}
      />
    );
  }

  if (hero.kind === "upcoming-only") {
    return (
      <NextGameBanner
        games={heroGames}
        predictions={predictions}
        knockoutPredictions={knockoutPredictions}
        currentUserId={currentUserId}
        limit={2}
      />
    );
  }

  return null;
}