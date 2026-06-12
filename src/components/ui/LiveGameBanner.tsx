"use client";

import { useEffect, useState } from "react";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { Flag } from "@/components/ui/Flag";
import { getLiveGames, getElapsedMinutes } from "@/lib/liveGames";
import { useLiveScores, findLiveScoreForGame } from "@/hooks/useLiveScores";
import { calculatePredictionPoints } from "@/services/predictions/predictionCalculations";

interface LiveGameBannerProps {
  games: Game[];
  predictions: Prediction[];
  currentUserId: string;
}

function KickoffTime({ matchDate }: { matchDate: string }) {
  const time = new Date(matchDate).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return <span className="text-xs font-semibold text-slate-400">{time}</span>;
}

export function LiveGameBanner({ games, predictions, currentUserId }: LiveGameBannerProps) {
  const [liveGames, setLiveGames] = useState<Game[]>([]);
  const liveScores = useLiveScores(liveGames);

  useEffect(() => {
    const update = () => setLiveGames(getLiveGames(games));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [games]);

  if (liveGames.length === 0) return null;

  const label = liveGames.length === 1 ? "Jogo do Momento" : "Jogos do Momento";

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
        </span>
        <span className="text-sm font-black text-amber-400 uppercase tracking-widest">
          {label}
        </span>
        {liveGames.length > 1 && (
          <span className="text-xs text-slate-400">— {liveGames.length} jogos agora</span>
        )}
      </div>

      {/* One card per live game */}
      <div className={liveGames.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : ""}>
        {liveGames.map((game) => {
          const prediction = predictions.find(
            (p) => p.player_id === currentUserId && p.game_id === game.id
          );
          const hasPrediction =
            prediction?.predicted_score_a != null &&
            prediction?.predicted_score_b != null;
          const liveScore = findLiveScoreForGame(game, liveScores);

          const hasLiveScore =
           liveScore?.homeScore !== null &&
           liveScore?.homeScore !== undefined &&
           liveScore?.awayScore !== null &&
           liveScore?.awayScore !== undefined;
           const livePoints =
  hasLiveScore && prediction
    ? calculatePredictionPoints(prediction, {
        ...game,
        official_score_a: liveScore!.homeScore,
        official_score_b: liveScore!.awayScore,
      }).points
    : null;

const livePointsMessage =
  livePoints === null
    ? null
    : livePoints === 15
      ? "🔥 Placar exato neste momento"
      : livePoints > 0
        ? `🏆 Você está fazendo ${livePoints} pontos`
        : "❌ Nenhum ponto neste momento";
          const elapsedMinutes = game.match_date ? getElapsedMinutes(game.match_date) : null;

          const isFinished = liveScore?.status === "FINISHED";

const liveMinute =
  isFinished
    ? "Encerrado"
    : elapsedMinutes === null
      ? null
      : elapsedMinutes <= 45
        ? `${elapsedMinutes}'`
        : elapsedMinutes <= 60
          ? "Intervalo"
          : elapsedMinutes <= 120
            ? `${Math.min(elapsedMinutes - 15, 90)}'`
            : "Aguardando atualização";

          return (
            <div
              key={game.id}
              className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-5 shadow-[0_0_24px_rgba(245,158,11,0.12)] overflow-hidden"
            >
              {/* Glow strip at top */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

              {/* Top row: pill + group label */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 rounded-full px-3 py-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    Acontecendo agora
                  </span>
                  {liveMinute && (
  <>
                   <span className="text-amber-700 text-xs mx-0.5">·</span>
                  <span className="text-xs font-black text-white">
                 ⏱ {liveMinute}
                  </span>
                </>
                  )}
                  {game.match_date && (
                    <>
                      <span className="text-amber-700 text-xs mx-0.5">·</span>
                      <KickoffTime matchDate={game.match_date} />
                    </>
                  )}
                </div>

                {game.group_name && (
                  <span className="text-xs text-slate-500 font-semibold">
                    Grupo {game.group_name}
                  </span>
                )}
              </div>

              {/* Teams + predicted score */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                {/* Team A */}
                <div className="flex flex-col items-center gap-2 min-w-0">
                  <Flag team={game.team_a} size="large" />
                  <span className="text-sm font-black text-white text-center leading-tight">
                    {game.team_a}
                  </span>
                </div>

                {/* Center */}
<div className="flex flex-col items-center gap-2">

  {hasLiveScore && liveScore && (
    <>
      <span className="text-[10px] font-black text-red-400 uppercase tracking-widest bg-red-500/10 border border-red-500/25 rounded-full px-3 py-0.5">
        Placar ao vivo
      </span>

      <div className="flex items-center gap-2">
  <span className="text-4xl font-black text-red-300 tabular-nums">
    {liveScore.homeScore}
  </span>

  <span className="text-2xl font-black text-slate-500">×</span>

  <span className="text-4xl font-black text-red-300 tabular-nums">
    {liveScore.awayScore}
  </span>
</div>
      {livePointsMessage && (
  <div
      className={`text-base font-black rounded-full px-4 py-2 border ${
      livePoints === 15
        ? "text-yellow-300 bg-yellow-500/10 border-yellow-500/30"
        : livePoints && livePoints > 0
          ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
          : "text-red-300 bg-red-500/10 border-red-500/30"
    }`}
  >
    {livePointsMessage}
    {livePoints === 15 ? " · +15 pts" : ""}
  </div>
)}
    </>
  )}

  {hasPrediction ? (
  <>
    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/25 rounded-full px-3 py-0.5">
      Seu palpite
    </span>

    <div className="flex items-center gap-2">
      <span className="text-4xl font-black text-amber-300 tabular-nums">
        {prediction!.predicted_score_a}
      </span>

      <span className="text-2xl font-black text-slate-500">×</span>

      <span className="text-4xl font-black text-amber-300 tabular-nums">
        {prediction!.predicted_score_b}
      </span>
    </div>
  </>
) : (
    <>
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-800 border border-slate-700 rounded-full px-3 py-0.5">
        Sem palpite
      </span>

      <div className="flex items-center gap-2">
        <span className="text-3xl font-black text-slate-600">—</span>
        <span className="text-xl font-black text-slate-700">×</span>
        <span className="text-3xl font-black text-slate-600">—</span>
      </div>
    </>
  )}

</div>

                {/* Team B */}
                <div className="flex flex-col items-center gap-2 min-w-0">
                  <Flag team={game.team_b} size="large" />
                  <span className="text-sm font-black text-white text-center leading-tight">
                    {game.team_b}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
