"use client";

import { Game } from "@/types/game";
import { LiveScoreMatch, findLiveScoreForGame } from "@/hooks/useLiveScores";
import { Prediction } from "@/types/prediction";
import { KnockoutPrediction } from "@/types/knockout";
import { MatchCard } from "@/components/ui/MatchCard";
import { StickySectionHeader } from "./StickySectionHeader";
import { DashboardUnmatchedLiveCard } from "./DashboardUnmatchedLiveCard";

interface DashboardLiveCardProps {
  liveGames: Game[];
  recentlyFinishedGames?: Game[];
  upcomingGame?: Game | null;
  liveScores: LiveScoreMatch[];
  unmatchedLiveScores?: LiveScoreMatch[];
  myPredictions?: Prediction[];
  knockoutPredictions?: KnockoutPrediction[];
  currentUserId?: string;
  onRefresh?: () => void | Promise<void>;
}

function getKnockoutMatchId(game: Game): number | null {
  const raw = String(game.id);

  if (raw.startsWith("knockout-")) {
    const id = Number(raw.replace("knockout-", ""));
    return Number.isFinite(id) ? id : null;
  }

  if (game.phase !== "groups" && game.match_order) {
    return Number(game.match_order);
  }

  return null;
}

function findPredictionForGame({
  game,
  currentUserId,
  myPredictions,
  knockoutPredictions,
}: {
  game: Game;
  currentUserId?: string;
  myPredictions: Prediction[];
  knockoutPredictions: KnockoutPrediction[];
}): Prediction | undefined {
  if (!currentUserId) return undefined;

  const knockoutMatchId = getKnockoutMatchId(game);

  if (knockoutMatchId) {
    const knockoutPrediction = knockoutPredictions.find(
      (p) => p.player_id === currentUserId && p.match_id === knockoutMatchId
    );

    if (knockoutPrediction) {
      return {
        player_id: knockoutPrediction.player_id,
        game_id: game.id,
        predicted_score_a: knockoutPrediction.predicted_score_home,
        predicted_score_b: knockoutPrediction.predicted_score_away,
      };
    }
  }

  return myPredictions.find(
    (p) => p.player_id === currentUserId && p.game_id === game.id
  );
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
  recentlyFinishedGames = [],
  upcomingGame = null,
  liveScores,
  unmatchedLiveScores = [],
  myPredictions = [],
  knockoutPredictions = [],
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
      // Best-effort.
    }
  };

  const liveCount = liveGames.length + unmatchedLiveScores.length;
  const totalCount =
    liveCount + recentlyFinishedGames.length + (upcomingGame ? 1 : 0);

  if (totalCount === 0) return null;

  const hasLive = liveCount > 0;
  const label = hasLive
    ? liveCount === 1
      ? "Jogo do Momento"
      : "Jogos do Momento"
    : upcomingGame && recentlyFinishedGames.length > 0
      ? "Encerrado · A seguir"
      : "Encerrado há pouco";

  return (
    <div className="space-y-3">
      <StickySectionHeader>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            {hasLive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                hasLive ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
          </span>

          <span
            className={`text-base font-black uppercase tracking-widest ${
              hasLive ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {label}
          </span>

          {hasLive && totalCount > 1 && (
            <span className="text-base text-slate-400">
              — {totalCount} jogos agora
            </span>
          )}
        </div>
      </StickySectionHeader>

      <div className={totalCount > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : ""}>
        {liveGames.map((game) => {
          const prediction = findPredictionForGame({
            game,
            currentUserId,
            myPredictions,
            knockoutPredictions,
          });

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

        {unmatchedLiveScores.map((match) => (
          <DashboardUnmatchedLiveCard key={`upstream:${match.id}`} match={match} />
        ))}

        {recentlyFinishedGames.map((game) => {
          const prediction = findPredictionForGame({
            game,
            currentUserId,
            myPredictions,
            knockoutPredictions,
          });

          const liveScore = findLiveScoreForGame(game, liveScores);

          return (
            <MatchCard
              key={`finished:${game.id}`}
              game={game}
              prediction={prediction}
              mode="finished"
              liveScore={liveScore}
            />
          );
        })}

        {upcomingGame &&
          (() => {
            const prediction = findPredictionForGame({
              game: upcomingGame,
              currentUserId,
              myPredictions,
              knockoutPredictions,
            });

            return (
              <MatchCard
                key={`upcoming:${upcomingGame.id}`}
                game={upcomingGame}
                prediction={prediction}
                mode="prediction"
              />
            );
          })()}
      </div>
    </div>
  );
}
