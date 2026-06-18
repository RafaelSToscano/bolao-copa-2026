"use client";

import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { Calendar } from "lucide-react";
import { formatKickoffTime } from "@/lib/formatting";
import {
  DashboardMatchListCard,
  DashboardMatchListItem,
} from "./DashboardMatchListCard";

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
  const listItems: DashboardMatchListItem[] = games.map((game) => {
    const prediction = currentUserId
      ? predictions.find(
          (p) => p.player_id === currentUserId && p.game_id === game.id
        )
      : undefined;

    return {
      game,
      prediction,
      headline: (
        <span className="text-2xl font-black tabular-nums text-slate-200">
          {formatKickoffTime(game.match_date)}
        </span>
      ),
      metaRight: game.group_name ? (
        <span className="text-base font-black text-yellow-400 bg-yellow-500/10 border border-yellow-500/25 rounded-full px-3 py-1 whitespace-nowrap">
          Grupo {game.group_name}
        </span>
      ) : null,
    };
  });

  return (
    <DashboardMatchListCard
      icon={<Calendar className="text-yellow-400" size={20} />}
      title="Próximos jogos"
      emptyMessage="Nenhum jogo agendado."
      items={listItems}
    />
  );
}
