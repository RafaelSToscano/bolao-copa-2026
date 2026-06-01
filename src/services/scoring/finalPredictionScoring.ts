import { FinalPrediction } from "@/services/supabase/finalPredictionsService";
import { TournamentResult } from "@/services/supabase/tournamentResultService";

export function calculateFinalPredictionPoints(
  prediction: FinalPrediction | null | undefined,
  result: TournamentResult | null | undefined
): number {
  if (!prediction || !result) return 0;

  let points = 0;

  if (prediction.champion && prediction.champion === result.champion) {
    points += 40;
  }

  if (prediction.runner_up && prediction.runner_up === result.runner_up) {
    points += 25;
  }

  if (prediction.third_place && prediction.third_place === result.third_place) {
    points += 15;
  }

  return points;
}