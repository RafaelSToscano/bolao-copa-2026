"use client";

import { useState } from "react";
import { Game } from "@/types/game";
import { Flag } from "@/components/ui/Flag";
import { findLiveScoreForGame, LiveScoreMatch } from "@/hooks/useLiveScores";
import { calculatePredictionPointsBreakdown } from "@/services/predictions/predictionCalculations";
import { Prediction } from "@/types/prediction";
import { describeLiveMinute, resolveLiveScore } from "@/lib/liveGames";
import { LivePill } from "./LivePill";
import { StickySectionHeader } from "./StickySectionHeader";
import { PointsChip } from "./PointsChip";

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

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
  // Tracks which (gameId, side) buttons are currently mid-request so
  // we can disable them and avoid the rapid-double-click bug where a
  // user adds two goals because the first request was still in
  // flight.
  const [pendingBumps, setPendingBumps] = useState<Set<string>>(new Set());

  const isPending = (gameId: string, side: "home" | "away") =>
    pendingBumps.has(`${gameId}:${side}`);

  const handleBump = async (
    gameId: string,
    side: "home" | "away",
    delta: number
  ) => {
    const key = `${gameId}:${side}`;
    if (pendingBumps.has(key)) return;

    setPendingBumps((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    try {
      await bumpMockScore(gameId, side, delta);
      if (onRefresh) await onRefresh();
    } catch {
      // Best-effort — leaving the button enabled on error would be
      // worse than silently logging since a stuck request is rare in
      // mock mode. Real failures will surface on the next poll.
    } finally {
      setPendingBumps((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
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
          const hasPrediction =
            prediction?.predicted_score_a != null &&
            prediction?.predicted_score_b != null;
          const liveScore = findLiveScoreForGame(game, liveScores);
          const { home: homeScore, away: awayScore } = resolveLiveScore(
            game,
            liveScore
          );
          const hasScore = homeScore != null && awayScore != null;

          const liveBreakdown =
            hasScore && prediction
              ? calculatePredictionPointsBreakdown(prediction, {
                  ...game,
                  official_score_a: homeScore,
                  official_score_b: awayScore,
                })
              : null;

          const liveMinute = describeLiveMinute(game, liveScore);

          return (
            <div
              key={game.id}
              className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-5 shadow-[0_0_24px_rgba(245,158,11,0.12)] overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

              <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                <LivePill />

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {liveMinute && (
                    <span className="text-base font-black text-white bg-slate-800/70 border border-slate-700 rounded-full px-3 py-1 shrink-0 whitespace-nowrap">
                      ⏱ {liveMinute}
                    </span>
                  )}

                  {game.group_name && (
                    <span className="text-base font-bold text-slate-300 bg-slate-800/70 border border-slate-700 rounded-full px-3 py-1 shrink-0 whitespace-nowrap">
                      Grupo {game.group_name}
                    </span>
                  )}
                </div>
              </div>

              {/* Match row: team A | live score | team B */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="flex flex-col items-center gap-2 min-w-0">
                  <span className="inline-flex [&>img]:!mr-0">
                    <Flag team={game.team_a} size="large" />
                  </span>
                  <span className="text-base font-black text-white text-center leading-tight">
                    {game.team_a}
                  </span>
                  {USE_MOCK_DATA && (
                    <button
                      type="button"
                      onClick={() => handleBump(game.id, "home", 1)}
                      disabled={isPending(game.id, "home")}
                      aria-busy={isPending(game.id, "home")}
                      className="mt-1 w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/50 text-emerald-200 font-black text-base hover:bg-emerald-600/50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-400 disabled:border-slate-700"
                      aria-label={`Marcar gol para ${game.team_a}`}
                    >
                      {isPending(game.id, "home") ? "…" : "+"}
                    </button>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2">
                  {hasScore ? (
                    <div className="flex items-center gap-3">
                      <span className="text-5xl font-black text-red-300 tabular-nums">
                        {homeScore}
                      </span>
                      <span className="text-3xl font-black text-slate-500">×</span>
                      <span className="text-5xl font-black text-red-300 tabular-nums">
                        {awayScore}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-slate-600">
                      <span className="text-5xl font-black tabular-nums">—</span>
                      <span className="text-3xl font-black">×</span>
                      <span className="text-5xl font-black tabular-nums">—</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2 min-w-0">
                  <span className="inline-flex [&>img]:!mr-0">
                    <Flag team={game.team_b} size="large" />
                  </span>
                  <span className="text-base font-black text-white text-center leading-tight">
                    {game.team_b}
                  </span>
                  {USE_MOCK_DATA && (
                    <button
                      type="button"
                      onClick={() => handleBump(game.id, "away", 1)}
                      disabled={isPending(game.id, "away")}
                      aria-busy={isPending(game.id, "away")}
                      className="mt-1 w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/50 text-emerald-200 font-black text-base hover:bg-emerald-600/50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-400 disabled:border-slate-700"
                      aria-label={`Marcar gol para ${game.team_b}`}
                    >
                      {isPending(game.id, "away") ? "…" : "+"}
                    </button>
                  )}
                </div>
              </div>

              {/* Prediction strip: full-width below the score so the team
                  columns can keep their natural width */}
              <div className="mt-4 flex flex-col items-center gap-2 border-t border-slate-800 pt-4">
                {hasPrediction ? (
                  <div className="flex items-center gap-3 flex-wrap justify-center">
                    <span className="text-base font-black text-amber-400 uppercase tracking-wider bg-amber-500/10 border border-amber-500/25 rounded-full px-3 py-1">
                      Seu palpite
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-amber-300 tabular-nums">
                        {prediction!.predicted_score_a}
                      </span>
                      <span className="text-lg font-black text-slate-500">×</span>
                      <span className="text-2xl font-black text-amber-300 tabular-nums">
                        {prediction!.predicted_score_b}
                      </span>
                    </div>
                    <PointsChip breakdown={liveBreakdown} provisional />
                  </div>
                ) : (
                  <span className="text-base font-black text-slate-500 uppercase tracking-wider bg-slate-800 border border-slate-700 rounded-full px-3 py-1">
                    Sem palpite
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
