"use client";

import { Clock } from "lucide-react";
import { DashboardRecentItem } from "@/types/dashboard";
import { calculatePredictionPointsBreakdown } from "@/services/predictions/predictionCalculations";
import { KnockoutRound } from "@/types/knockout";
import {
  DashboardMatchListCard,
  DashboardMatchListItem,
} from "./DashboardMatchListCard";
import { PointsChip } from "./PointsChip";

interface RecentResultsCardProps {
  items: DashboardRecentItem[];
}

const KNOCKOUT_PHASE_SHORT: Record<KnockoutRound, string> = {
  r32: "16 avos",
  r16: "Oitavas",
  qf: "Quartas",
  sf: "Semi",
  third_place: "3º lugar",
  final: "Final",
};

function getPhaseLabel(phase: string, groupName: string | null) {
  if (phase in KNOCKOUT_PHASE_SHORT) {
    return KNOCKOUT_PHASE_SHORT[phase as KnockoutRound];
  }
  return groupName ? `Grupo ${groupName}` : null;
}

export function RecentResultsCard({ items }: RecentResultsCardProps) {
  const listItems: DashboardMatchListItem[] = items.map(
    ({ game, myPrediction, myPoints }) => {
      const hasPrediction =
        myPrediction?.predicted_score_a != null &&
        myPrediction?.predicted_score_b != null;

      const phaseLabel = getPhaseLabel(game.phase, game.group_name);

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
        metaInline: phaseLabel ? (
          <span className="font-semibold whitespace-nowrap">
            · {phaseLabel}
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
      showTodayLabel={false}
    />
  );
}
