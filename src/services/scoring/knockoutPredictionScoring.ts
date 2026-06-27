import { SCORING_RULES } from "@/config/scoring";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";

type PredictionScoreResult = {
  points: number;
  exact: number;
};

function getOutcome(scoreA: number, scoreB: number): "home" | "away" | "draw" {
  if (scoreA > scoreB) return "home";
  if (scoreA < scoreB) return "away";
  return "draw";
}

export function calculateKnockoutPredictionPoints(
  prediction: KnockoutPrediction | undefined,
  match: KnockoutMatchRecord
): PredictionScoreResult {
  if (
    !prediction ||
    prediction.predicted_score_home === null ||
    prediction.predicted_score_away === null ||
    match.official_score_home === null ||
    match.official_score_away === null
  ) {
    return { points: 0, exact: 0 };
  }

  const predictedHome = prediction.predicted_score_home;
  const predictedAway = prediction.predicted_score_away;
  const officialHome = match.official_score_home;
  const officialAway = match.official_score_away;

  let points = 0;
  let exact = 0;

  if (predictedHome === officialHome && predictedAway === officialAway) {
    points += SCORING_RULES.EXACT_SCORE;
    exact = 1;
  } else if (
    getOutcome(predictedHome, predictedAway) === getOutcome(officialHome, officialAway)
  ) {
    points += SCORING_RULES.CORRECT_OUTCOME;
  }

  if (predictedHome === officialHome) {
    points += SCORING_RULES.CORRECT_TEAM_SCORE;
  }

  if (predictedAway === officialAway) {
    points += SCORING_RULES.CORRECT_TEAM_SCORE;
  }

  return { points, exact };
}
