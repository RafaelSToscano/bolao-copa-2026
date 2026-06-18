"use client";

import { Clock } from "lucide-react";
import { DashboardRecentItem } from "@/types/dashboard";
import { calculatePredictionPointsBreakdown } from "@/services/predictions/predictionCalculations";
import {
  DashboardMatchListCard,
  DashboardMatchListItem,
} from "./DashboardMatchListCard";
import { PointsChip } from "./PointsChip";

interface RecentResultsCardProps {
  items: DashboardRecentItem[];
}

export function RecentResultsCard({ items }: RecentResultsCardProps) {
  const listItems: DashboardMatchListItem[] = items.map(
    ({ game, myPrediction, myPoints }) => {
      const hasPrediction =
        myPrediction?.predicted_score_a != null &&
        myPrediction?.predicted_score_b != null;

      return {
        game,
        prediction: myPrediction,
        headline: (
          <div className="flex items-center gap-3">
            <span className="text-4xl font-black tabular-nums text-white">
              {game.official_score_a}
            </span>
            <span className="text-xl font-black text-slate-500">×</span>
            <span className="text-4xl font-black tabular-nums text-white">
              {game.official_score_b}
            </span>
          </div>
        ),
        metaInline: game.group_name ? (
          <span className="font-semibold whitespace-nowrap">
            · Grupo {game.group_name}
          </span>
        ) : null,
        metaRight: hasPrediction ? (
          <PointsChip
            breakdown={calculatePredictionPointsBreakdown(myPrediction!, game)}
            label={
              myPoints === 15
                ? "🔥 +15 pts"
                : myPoints > 0
                  ? `+${myPoints} pts`
                  : "0 pts"
            }
          />
        ) : null,
      };
    }
  );

  return (
    <DashboardMatchListCard
      icon={<Clock className="text-yellow-400" size={20} />}
      title="Resultados recentes"
      emptyMessage="Aguardando primeiros resultados."
      items={listItems}
    />
  );
}
