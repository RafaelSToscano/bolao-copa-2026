"use client";

import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutPrediction } from "@/types/knockout";
import { Calendar } from "lucide-react";
import { formatKickoffTime, formatWeekdayShort } from "@/lib/formatting";
import {
  DashboardMatchListCard,
  DashboardMatchListItem,
} from "./DashboardMatchListCard";

interface UpcomingMatchesCardProps {
  games: Game[];
  predictions?: Prediction[];
  knockoutPredictions?: KnockoutPrediction[];
  currentUserId?: string;
}

function getKnockoutMatchId(game: Game): number | null {
  const raw = String(game.id);

  if (raw.startsWith("knockout-")) {
    const id = Number(raw.replace("knockout-", ""));
    return Number.isFinite(id) ? id : null;
  }

  if (game.phase !== "groups" && game.match_order) {
    return Number(game.match_order);
  }

  return null;
}

export function UpcomingMatchesCard({
  games,
  predictions = [],
  knockoutPredictions = [],
  currentUserId,
}: UpcomingMatchesCardProps) {
  const listItems: DashboardMatchListItem[] = games.map((game) => {
    const knockoutMatchId = getKnockoutMatchId(game);

    const groupPrediction = currentUserId
      ? predictions.find(
          (p) => p.player_id === currentUserId && p.game_id === game.id
        )
      : undefined;

    const knockoutPrediction =
      currentUserId && knockoutMatchId
        ? knockoutPredictions.find(
            (p) =>
              p.player_id === currentUserId &&
              p.match_id === knockoutMatchId
          )
        : undefined;

    const prediction: Prediction | undefined = knockoutPrediction
      ? {
          player_id: knockoutPrediction.player_id,
          game_id: game.id,
          predicted_score_a: knockoutPrediction.predicted_score_home,
          predicted_score_b: knockoutPrediction.predicted_score_away,
        }
      : groupPrediction;

    return {
      game,
      prediction,
      headline: (
        <span className="text-2xl font-black tabular-nums text-slate-200">
          {formatKickoffTime(game.match_date)}
        </span>
      ),
      metaInline: game.group_name ? (
        <span className="font-semibold whitespace-nowrap">
          · Grupo {game.group_name}
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
      formatDate={formatWeekdayShort}
    />
  );
}