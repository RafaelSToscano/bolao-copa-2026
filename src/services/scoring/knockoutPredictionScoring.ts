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

  const pa = prediction.predicted_score_home;
  const pb = prediction.predicted_score_away;
  const ra = match.official_score_home;
  const rb = match.official_score_away;

  if (pa === ra && pb === rb) {
    return { points: SCORING_RULES.EXACT_SCORE, exact: 1 };
  }

  let points = 0;

  if (getOutcome(pa, pb) === getOutcome(ra, rb)) {
    points += SCORING_RULES.CORRECT_OUTCOME;
  }

  if (pa === ra) points += SCORING_RULES.CORRECT_TEAM_SCORE;
  if (pb === rb) points += SCORING_RULES.CORRECT_TEAM_SCORE;

  return { points, exact: 0 };
}