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

                  <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                    <div className="flex flex-col items-center gap-1.5 min-w-0">
                      <Flag team={game.team_a} size="medium" />
                      <span className="text-sm font-black text-white text-center leading-tight">
                        {game.team_a}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black tabular-nums text-white">
                        {game.official_score_a}
                      </span>
                      <span className="text-xl font-black text-slate-500">×</span>
                      <span className="text-3xl font-black tabular-nums text-white">
                        {game.official_score_b}
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 min-w-0">
                      <Flag team={game.team_b} size="medium" />
                      <span className="text-sm font-black text-white text-center leading-tight">
                        {game.team_b}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex items-center justify-center gap-3 flex-wrap">
                    {hasPrediction ? (
                      <>
                        <span className="text-base font-black uppercase tracking-wider rounded-full px-3 py-1 bg-[#2A398D]/15 border border-[#2A398D]/40 text-blue-300">
                          Palpite
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black tabular-nums text-blue-200">
                            {myPrediction!.predicted_score_a}
                          </span>
                          <span className="text-lg font-black text-slate-500">×</span>
                          <span className="text-2xl font-black tabular-nums text-blue-200">
                            {myPrediction!.predicted_score_b}
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="text-base font-black text-slate-500 uppercase tracking-wider bg-slate-800 border border-slate-700 rounded-full px-3 py-1">
                        Sem palpite
                      </span>
                    )}
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
