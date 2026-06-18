"use client";

import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { Calendar } from "lucide-react";
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
      metaRight: game.group_name ? (
        <span className="text-yellow-400 font-bold text-base">
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
