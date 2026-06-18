"use client";

import { ReactNode } from "react";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { Card, CardContent } from "@/components/ui/card";
import { Flag } from "@/components/ui/Flag";
import { formatWeekdayDate, isToday } from "@/lib/formatting";
import { StickySectionHeader } from "./StickySectionHeader";

export interface DashboardMatchListItem {
  game: Game;
  prediction?: Prediction | null;
  /** Center cell of row 1. Recent passes the official score; upcoming
   * passes nothing (the meta row already shows the kickoff). */
  headline?: ReactNode;
  /** Right-hand slot in the meta row, after the optional "Hoje" badge.
   * Recent passes a `PointsChip`, upcoming passes the group label. */
  metaRight?: ReactNode;
}

interface DashboardMatchListCardProps {
  icon: ReactNode;
  title: string;
  emptyMessage: string;
  items: DashboardMatchListItem[];
}

export function DashboardMatchListCard({
  icon,
  title,
  emptyMessage,
  items,
}: DashboardMatchListCardProps) {
  return (
    <div className="space-y-3">
      <StickySectionHeader>
        <h2 className="text-xl font-black flex items-center gap-2">
          {icon}
          {title}
        </h2>
      </StickySectionHeader>

      <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl">
        <CardContent className="p-0 overflow-hidden">
          {items.length === 0 ? (
            <div className="p-5 text-center text-base text-slate-400">
              {emptyMessage}
            </div>
          ) : (
            items.map((item) => (
              <MatchRow key={item.game.id} item={item} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MatchRow({ item }: { item: DashboardMatchListItem }) {
  const { game, prediction, headline, metaRight } = item;
  const today = isToday(game.match_date);
  const hasPrediction =
    prediction?.predicted_score_a != null &&
    prediction?.predicted_score_b != null;

  return (
    <div
      className={`p-4 border-b border-slate-800 last:border-b-0 space-y-3 ${
        today ? "bg-amber-500/[0.04] border-l-2 border-l-amber-500/60" : ""
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
          {metaRight}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-[auto_auto] gap-x-4 gap-y-1 items-center justify-items-center">
        <Flag team={game.team_a} size="medium" />

        <div className="flex items-center justify-center">{headline}</div>

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
              <span className="text-sm font-black text-slate-500">×</span>
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
}
