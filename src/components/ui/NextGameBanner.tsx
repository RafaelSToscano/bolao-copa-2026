"use client";

import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { Flag } from "@/components/ui/Flag";
import { getNextGames } from "@/lib/liveGames";
import { formatDate } from "@/lib/formatting";

interface NextGameBannerProps {
  games: Game[];
  predictions: Prediction[];
  currentUserId: string;
}

export function NextGameBanner({
  games,
  predictions,
  currentUserId,
}: NextGameBannerProps) {
  const nextGames = getNextGames(games, 2);

  if (nextGames.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-blue-400 uppercase tracking-widest">
          ⏭️ Próximos Jogos
        </span>
      </div>

      <div className={nextGames.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : ""}>
        {nextGames.map((game) => {
          const prediction = predictions.find(
            (p) => p.player_id === currentUserId && p.game_id === game.id
          );

          const hasPrediction =
            prediction?.predicted_score_a != null &&
            prediction?.predicted_score_b != null;

          return (
            <div
              key={game.id}
              className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-blue-500/30 rounded-3xl p-5 shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-black text-blue-300 uppercase tracking-wider bg-blue-500/10 border border-blue-500/25 rounded-full px-3 py-1">
                  {formatDate(game.match_date)}
                </div>

                {game.group_name && (
                  <span className="text-xs text-slate-500 font-semibold">
                    Grupo {game.group_name}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="flex flex-col items-center gap-2 min-w-0">
                  <Flag team={game.team_a} size="large" />
                  <span className="text-sm font-black text-white text-center leading-tight">
                    {game.team_a}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest bg-blue-500/10 border border-blue-500/25 rounded-full px-3 py-0.5">
                    Seu palpite
                  </span>

                  {hasPrediction ? (
                    <div className="flex items-center gap-2">
                      <span className="text-4xl font-black text-blue-300 tabular-nums">
                        {prediction!.predicted_score_a}
                      </span>
                      <span className="text-2xl font-black text-slate-500">×</span>
                      <span className="text-4xl font-black text-blue-300 tabular-nums">
                        {prediction!.predicted_score_b}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-slate-400">
                      Sem palpite registrado
                    </div>
                  )}
                </div>

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