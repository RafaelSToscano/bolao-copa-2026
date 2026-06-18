"use client";

import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { Card, CardContent } from "@/components/ui/card";
import { Flag } from "@/components/ui/Flag";
import { Calendar } from "lucide-react";
import { formatDate, isToday } from "@/lib/formatting";
import { StickySectionHeader } from "./StickySectionHeader";

interface UpcomingMatchesCardProps {
  games: Game[];
  predictions?: Prediction[];
  currentUserId?: string;
}

export function UpcomingMatchesCard({
  games,
  predictions = [],
  currentUserId,
}: UpcomingMatchesCardProps) {
  return (
    <div className="space-y-3">
      <StickySectionHeader>
        <h2 className="text-xl font-black flex items-center gap-2">
          <Calendar className="text-yellow-400" size={20} />
          Próximos jogos
        </h2>
      </StickySectionHeader>

      <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl">
        <CardContent className="p-0 overflow-hidden">
          {games.length === 0 ? (
            <div className="p-5 text-center text-base text-slate-400">
              Nenhum jogo agendado.
            </div>
          ) : (
            games.map((game) => {
              const today = isToday(game.match_date);
              const prediction = currentUserId
                ? predictions.find(
                    (p) =>
                      p.player_id === currentUserId && p.game_id === game.id
                  )
                : undefined;
              const hasPrediction =
                prediction?.predicted_score_a != null &&
                prediction?.predicted_score_b != null;

              return (
                <div
                  key={game.id}
                  className={`p-4 border-b border-slate-800 last:border-b-0 ${
                    today
                      ? "bg-amber-500/[0.04] border-l-2 border-l-amber-500/60"
                      : ""
                  }`}
                >
                  <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-[auto_auto] gap-x-4 gap-y-1 items-center justify-items-center">
                    <Flag team={game.team_a} size="medium" />

                    <div className="flex flex-col items-center text-base gap-0.5">
                      {today && (
                        <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                          Hoje
                        </span>
                      )}
                      <span className="text-slate-400 font-semibold">
                        {formatDate(game.match_date)}
                      </span>
                      {game.group_name && (
                        <span className="text-yellow-400 font-bold">
                          Grupo {game.group_name}
                        </span>
                      )}
                    </div>

                    <Flag team={game.team_b} size="medium" />

                    <span className="text-sm font-black text-white text-center leading-tight min-w-0 truncate">
                      {game.team_a}
                    </span>

                    {hasPrediction ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                          Palpite
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-black tabular-nums text-blue-200">
                            {prediction!.predicted_score_a}
                          </span>
                          <span className="text-sm font-black text-slate-500">
                            ×
                          </span>
                          <span className="text-base font-black tabular-nums text-blue-200">
                            {prediction!.predicted_score_b}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Sem palpite
                      </span>
                    )}

                    <span className="text-sm font-black text-white text-center leading-tight min-w-0 truncate">
                      {game.team_b}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
