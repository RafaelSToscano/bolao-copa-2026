"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Flag } from "@/components/ui/Flag";
import { Clock } from "lucide-react";
import { DashboardRecentItem } from "@/types/dashboard";
import { calculatePredictionPointsBreakdown } from "@/services/predictions/predictionCalculations";
import { formatWeekdayDate, isToday } from "@/lib/formatting";
import { StickySectionHeader } from "./StickySectionHeader";
import { PointsChip } from "./PointsChip";

interface RecentResultsCardProps {
  items: DashboardRecentItem[];
}

export function RecentResultsCard({ items }: RecentResultsCardProps) {
  return (
    <div className="space-y-3">
      <StickySectionHeader>
        <h2 className="text-xl font-black flex items-center gap-2">
          <Clock className="text-yellow-400" size={20} />
          Resultados recentes
        </h2>
      </StickySectionHeader>

      <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl">
        <CardContent className="p-0 overflow-hidden">
          {items.length === 0 ? (
            <div className="p-5 text-center text-base text-slate-400">
              Aguardando primeiros resultados.
            </div>
          ) : (
            items.map(({ game, myPrediction, myPoints }) => {
              const hasPrediction =
                myPrediction?.predicted_score_a != null &&
                myPrediction?.predicted_score_b != null;
              const today = isToday(game.match_date);

              return (
                <div
                  key={game.id}
                  className={`p-4 border-b border-slate-800 last:border-b-0 space-y-3 ${
                    today
                      ? "bg-amber-500/[0.04] border-l-2 border-l-amber-500/60"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
                    <span className="font-semibold tabular-nums">
                      {formatWeekdayDate(game.match_date)}
                    </span>
                    <div className="flex items-center gap-2">
                      {today && (
                        <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                          Hoje
                        </span>
                      )}
                      {hasPrediction && (
                        <PointsChip
                          breakdown={calculatePredictionPointsBreakdown(
                            myPrediction,
                            game
                          )}
                          label={
                            myPoints === 15
                              ? "🔥 +15 pts"
                              : myPoints > 0
                                ? `+${myPoints} pts`
                                : "0 pts"
                          }
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                    <div className="flex items-center gap-2 min-w-0">
                      <Flag team={game.team_a} size="medium" />
                      <span className="font-bold truncate">{game.team_a}</span>
                    </div>

                    <span className="text-slate-500 text-sm font-bold">×</span>

                    <div className="flex items-center gap-2 justify-end min-w-0">
                      <span className="font-bold truncate text-right">
                        {game.team_b}
                      </span>
                      <Flag team={game.team_b} size="medium" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3 flex flex-col items-center gap-1">
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                        Resultado
                      </span>
                      <span className="text-lg font-black tabular-nums text-white">
                        {game.official_score_a} × {game.official_score_b}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3 flex flex-col items-center gap-1">
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                        Seu palpite
                      </span>
                      {hasPrediction ? (
                        <span className="text-lg font-black tabular-nums text-amber-300">
                          {myPrediction!.predicted_score_a} ×{" "}
                          {myPrediction!.predicted_score_b}
                        </span>
                      ) : (
                        <span className="text-base font-bold text-slate-500">
                          Sem palpite
                        </span>
                      )}
                    </div>
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
