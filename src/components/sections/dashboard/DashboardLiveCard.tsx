"use client";

import { Game } from "@/types/game";
import { LiveScoreMatch, findLiveScoreForGame } from "@/hooks/useLiveScores";
import { Prediction } from "@/types/prediction";
import { MatchCard } from "@/components/ui/MatchCard";
import { StickySectionHeader } from "./StickySectionHeader";

interface DashboardLiveCardProps {
  liveGames: Game[];
  liveScores: LiveScoreMatch[];
  myPredictions?: Prediction[];
  currentUserId?: string;
  onRefresh?: () => void | Promise<void>;
}

async function bumpMockScore(
  gameId: string,
  side: "home" | "away",
  delta: number
): Promise<void> {
  const res = await fetch("/api/dashboard/mock-goal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId, side, delta }),
  });
  if (!res.ok) {
    throw new Error(`mock-goal failed: ${res.status}`);
  }
}

export function DashboardLiveCard({
  liveGames,
  liveScores,
  myPredictions = [],
  currentUserId,
  onRefresh,
}: DashboardLiveCardProps) {
  const handleBump = async (
    gameId: string,
    side: "home" | "away",
    delta: number
  ) => {
    try {
      await bumpMockScore(gameId, side, delta);
      if (onRefresh) await onRefresh();
    } catch {
      // Best-effort — leaving the button enabled on error would be
      // worse than silently logging since a stuck request is rare in
      // mock mode. Real failures will surface on the next poll.
    }
  };

  if (liveGames.length === 0) return null;

  const label = liveGames.length === 1 ? "Jogo do Momento" : "Jogos do Momento";

  return (
    <div className="space-y-3">
      <StickySectionHeader>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
          </span>
          <span className="text-base font-black text-amber-400 uppercase tracking-widest">
            {label}
          </span>
          {liveGames.length > 1 && (
            <span className="text-base text-slate-400">
              — {liveGames.length} jogos agora
            </span>
          )}
        </div>
      </StickySectionHeader>

      <div className={liveGames.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : ""}>
        {liveGames.map((game) => {
          const prediction = currentUserId
            ? myPredictions.find(
                (p) => p.player_id === currentUserId && p.game_id === game.id
              )
            : undefined;
          const liveScore = findLiveScoreForGame(game, liveScores);

          return (
            <MatchCard
              key={game.id}
              game={game}
              prediction={prediction}
              mode="live"
              liveScore={liveScore}
              onMockBump={handleBump}
            />
          );
        })}
      </div>
    </div>
  );
}
