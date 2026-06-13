"use client";

import { useMemo } from "react";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { useLiveScores } from "@/hooks/useLiveScores";
import { deriveLiveSignals } from "@/lib/liveSignals";
import { DashboardLiveCard } from "@/components/sections/dashboard/DashboardLiveCard";

interface LiveGameBannerProps {
  games: Game[];
  predictions: Prediction[];
  currentUserId: string;
}

/**
 * Live banner shown on the Palpites screen. Delegates rendering to
 * DashboardLiveCard so the Palpites and Dashboard live cards stay
 * pixel-identical and share their data flow — the Dashboard version
 * is the source of truth for live-card UI/UX.
 */
export function LiveGameBanner({ games, predictions, currentUserId }: LiveGameBannerProps) {
  const liveScores = useLiveScores(games);
  const { liveGames } = useMemo(
    () => deriveLiveSignals(games, liveScores),
    [games, liveScores]
  );

  if (liveGames.length === 0) return null;

  return (
    <DashboardLiveCard
      liveGames={liveGames}
      liveScores={liveScores}
      myPredictions={predictions}
      currentUserId={currentUserId}
    />
  );
}
