"use client";

import { useState } from "react";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { Flag } from "@/components/ui/Flag";
import { LiveScoreMatch } from "@/hooks/useLiveScores";
import {
  calculatePredictionPointsBreakdown,
  PredictionPointsBreakdown,
} from "@/services/predictions/predictionCalculations";
import { describeLiveMinute, resolveLiveScore } from "@/lib/liveGames";
import { LivePill } from "@/components/sections/dashboard/LivePill";
import { PointsChip } from "@/components/sections/dashboard/PointsChip";
import { formatDate } from "@/lib/formatting";

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export type MatchCardMode = "live" | "prediction" | "finished";

interface MatchCardProps {
  game: Game;
  prediction?: Prediction;
  mode: MatchCardMode;
  liveScore?: LiveScoreMatch | null;
  onMockBump?: (
    gameId: string,
    side: "home" | "away",
    delta: number
  ) => Promise<void> | void;
}

interface Theme {
  container: string;
  glow: string;
  predictionLabel: string;
  predictionLabelText: string;
  predictionScoreText: string;
}

const LIVE_THEME: Theme = {
  container:
    "border border-amber-500/30 shadow-[0_0_24px_rgba(245,158,11,0.12)]",
  glow: "bg-gradient-to-r from-transparent via-amber-500/60 to-transparent",
  predictionLabel: "bg-amber-500/10 border border-amber-500/25",
  predictionLabelText: "text-amber-400",
  predictionScoreText: "text-amber-300",
};

const PREDICTION_THEME: Theme = {
  container:
    "border border-[#2A398D]/50 shadow-[0_0_24px_rgba(42,57,141,0.18)]",
  glow: "bg-gradient-to-r from-transparent via-[#2A398D]/70 to-transparent",
  predictionLabel: "bg-[#2A398D]/15 border border-[#2A398D]/40",
  predictionLabelText: "text-blue-300",
  predictionScoreText: "text-blue-200",
};

const FINISHED_THEME: Theme = {
  container:
    "border border-emerald-500/30 shadow-[0_0_24px_rgba(16,185,129,0.12)]",
  glow: "bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent",
  predictionLabel: "bg-emerald-500/10 border border-emerald-500/25",
  predictionLabelText: "text-emerald-300",
  predictionScoreText: "text-emerald-200",
};

function themeFor(mode: MatchCardMode): Theme {
  if (mode === "live") return LIVE_THEME;
  if (mode === "finished") return FINISHED_THEME;
  return PREDICTION_THEME;
}

export function MatchCard({
  game,
  prediction,
  mode,
  liveScore = null,
  onMockBump,
}: MatchCardProps) {
  const theme = themeFor(mode);

  const hasPrediction =
    prediction?.predicted_score_a != null &&
    prediction?.predicted_score_b != null;

  const showsScore = mode === "live" || mode === "finished";
  const { home: homeScore, away: awayScore } = showsScore
    ? resolveLiveScore(game, liveScore)
    : { home: null, away: null };
  const hasScore = homeScore != null && awayScore != null;

  const scoredBreakdown: PredictionPointsBreakdown | null =
    showsScore && hasScore && prediction
      ? calculatePredictionPointsBreakdown(prediction, {
          ...game,
          official_score_a: homeScore,
          official_score_b: awayScore,
        })
      : null;

  const liveMinute = mode === "live" ? describeLiveMinute(game, liveScore) : null;

  return (
    <div
      data-testid="match-card"
      data-mode={mode}
      className={`relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-5 overflow-hidden ${theme.container}`}
    >
      <div className={`absolute inset-x-0 top-0 h-[2px] ${theme.glow}`} />

      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        {mode === "live" ? (
          <LivePill />
        ) : mode === "finished" ? (
          <FinishedPill matchDate={game.match_date} />
        ) : (
          <NextMatchPill matchDate={game.match_date} />
        )}

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

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <TeamColumn
          team={game.team_a}
          mockButton={
            mode === "live" && USE_MOCK_DATA && onMockBump ? (
              <MockBumpButton
                gameId={game.id}
                side="home"
                team={game.team_a}
                onBump={onMockBump}
              />
            ) : null
          }
        />

        <div className="flex flex-col items-center gap-2">
          {showsScore ? (
            hasScore ? (
              <ScoreNumbers
                home={homeScore!}
                away={awayScore!}
                tone={mode === "finished" ? "finished" : "live"}
              />
            ) : (
              <ScoreDashes />
            )
          ) : (
            <NextMatchKickoff matchDate={game.match_date} />
          )}
        </div>

        <TeamColumn
          team={game.team_b}
          mockButton={
            mode === "live" && USE_MOCK_DATA && onMockBump ? (
              <MockBumpButton
                gameId={game.id}
                side="away"
                team={game.team_b}
                onBump={onMockBump}
              />
            ) : null
          }
        />
      </div>

      <div className="mt-4 flex flex-col items-center gap-2 border-t border-slate-800 pt-4">
        {hasPrediction ? (
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span
              className={`text-base font-black uppercase tracking-wider rounded-full px-3 py-1 ${theme.predictionLabel} ${theme.predictionLabelText}`}
            >
              Palpite
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`text-2xl font-black tabular-nums ${theme.predictionScoreText}`}
              >
                {prediction!.predicted_score_a}
              </span>
              <span className="text-lg font-black text-slate-500">×</span>
              <span
                className={`text-2xl font-black tabular-nums ${theme.predictionScoreText}`}
              >
                {prediction!.predicted_score_b}
              </span>
            </div>
            {showsScore && (
              <PointsChip
                breakdown={scoredBreakdown}
                provisional={mode === "live"}
              />
            )}
          </div>
        ) : (
          <span className="text-base font-black text-slate-500 uppercase tracking-wider bg-slate-800 border border-slate-700 rounded-full px-3 py-1">
            Sem palpite
          </span>
        )}
      </div>
    </div>
  );
}

function TeamColumn({
  team,
  mockButton,
}: {
  team: string;
  mockButton: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <span className="inline-flex [&>img]:!mr-0">
        <Flag team={team} size="large" />
      </span>
      <span className="text-base font-black text-white text-center leading-tight">
        {team}
      </span>
      {mockButton}
    </div>
  );
}

function ScoreNumbers({
  home,
  away,
  tone = "live",
}: {
  home: number;
  away: number;
  tone?: "live" | "finished";
}) {
  const color = tone === "finished" ? "text-emerald-200" : "text-red-300";
  return (
    <div className="flex items-center gap-3">
      <span className={`text-5xl font-black ${color} tabular-nums`}>
        {home}
      </span>
      <span className="text-3xl font-black text-slate-500">×</span>
      <span className={`text-5xl font-black ${color} tabular-nums`}>
        {away}
      </span>
    </div>
  );
}

function ScoreDashes() {
  return (
    <div className="flex items-center gap-3 text-slate-600">
      <span className="text-5xl font-black tabular-nums">—</span>
      <span className="text-3xl font-black">×</span>
      <span className="text-5xl font-black tabular-nums">—</span>
    </div>
  );
}

function FinishedPill({ matchDate }: { matchDate: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 shrink-0">
      <span className="relative flex h-2.5 w-2.5">
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
      </span>
      <span className="text-base font-black text-emerald-300 uppercase tracking-wider whitespace-nowrap">
        Encerrado
      </span>
      {matchDate && (
        <>
          <span className="text-emerald-900 text-base mx-0.5">·</span>
          <span className="text-base font-semibold text-slate-300 whitespace-nowrap">
            {formatDate(matchDate)}
          </span>
        </>
      )}
    </span>
  );
}

function NextMatchPill({ matchDate }: { matchDate: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full px-3 py-1 shrink-0">
      <span className="relative flex h-2.5 w-2.5">
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-400" />
      </span>
      <span className="text-base font-black text-blue-300 uppercase tracking-wider whitespace-nowrap">
        Próximo jogo
      </span>
      {matchDate && (
        <>
          <span className="text-blue-900 text-base mx-0.5">·</span>
          <span className="text-base font-semibold text-slate-300 whitespace-nowrap">
            {formatDate(matchDate)}
          </span>
        </>
      )}
    </span>
  );
}

function NextMatchKickoff({ matchDate }: { matchDate: string | null }) {
  if (!matchDate) {
    return (
      <span className="text-3xl font-black text-slate-500 uppercase tracking-wider">
        VS
      </span>
    );
  }
  const time = new Date(matchDate).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
        Kick-off
      </span>
      <span className="text-3xl font-black text-white tabular-nums">{time}</span>
    </div>
  );
}

function MockBumpButton({
  gameId,
  side,
  team,
  onBump,
}: {
  gameId: string;
  side: "home" | "away";
  team: string;
  onBump: NonNullable<MatchCardProps["onMockBump"]>;
}) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (pending) return;
        setPending(true);
        try {
          await onBump(gameId, side, 1);
        } finally {
          setPending(false);
        }
      }}
      disabled={pending}
      aria-busy={pending}
      className="mt-1 w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/50 text-emerald-200 font-black text-base hover:bg-emerald-600/50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-400 disabled:border-slate-700"
      aria-label={`Marcar gol para ${team}`}
    >
      {pending ? "…" : "+"}
    </button>
  );
}
