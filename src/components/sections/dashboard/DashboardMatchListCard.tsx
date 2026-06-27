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
  /** Inline slot in the meta row, sitting between the date and the
   * optional "Hoje" badge. Upcoming uses this for the group label. */
  metaInline?: ReactNode;
  /** Right-hand slot in the meta row. Recent passes a `PointsChip`. */
  metaRight?: ReactNode;
}

interface DashboardMatchListCardProps {
  icon: ReactNode;
  title: string;
  emptyMessage: string;
  items: DashboardMatchListItem[];
  /** Override the meta-row date formatter. Defaults to weekday + date
   * + time ("Sex 20/06 · 17:00"). Upcoming overrides this with a
   * date-only formatter because the kickoff time already appears in
   * the row headline. */
  formatDate?: (value: string | null) => string;
}

export function DashboardMatchListCard({
  icon,
  title,
  emptyMessage,
  items,
  formatDate = formatWeekdayDate,
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
              <MatchRow
                key={item.game.id}
                item={item}
                formatDate={formatDate}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MatchRow({
  item,
  formatDate,
}: {
  item: DashboardMatchListItem;
  formatDate: (value: string | null) => string;
}) {
  const { game, prediction, headline, metaInline, metaRight } = item;
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
        <div className="flex items-center gap-2">
          <span className="font-semibold tabular-nums">
            {formatDate(game.match_date)}
          </span>
          {metaInline}
          {today && (
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
              Hoje
            </span>
          )}
        </div>
        {metaRight}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-[auto_auto] gap-x-4 gap-y-1 items-center justify-items-center">
        <Flag team={game.team_a} size="large" />

        <div className="flex items-center justify-center">{headline}</div>

        <Flag team={game.team_b} size="large" />

        <span className="text-base font-black text-white text-center leading-tight min-w-0 truncate">
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

        <span className="text-base font-black text-white text-center leading-tight min-w-0 truncate">
          {game.team_b}
        </span>
      </div>
    </div>
  );
}
