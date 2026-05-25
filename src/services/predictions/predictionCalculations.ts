import { Prediction, PredictionPoints } from "@/types/prediction";
import { Game } from "@/types/game";
import { SCORING_RULES } from "@/config/scoring";

/**
 * Determines the outcome of a match
 * @param goalsA - Goals scored by team A
 * @param goalsB - Goals scored by team B
 * @returns "A" if team A wins, "B" if team B wins, "E" if draw
 */
export function getOutcome(goalsA: number, goalsB: number): "A" | "B" | "E" {
  if (goalsA > goalsB) return "A";
  if (goalsA < goalsB) return "B";
  return "E";
}

/**
 * Calculates points awarded for a prediction against official result
 * @param prediction - User's prediction
 * @param game - Actual game result
 * @returns Object with total points and exact match count
 */
export function calculatePredictionPoints(
  prediction: Prediction | undefined,
  game: Game | undefined
): PredictionPoints {
  if (!prediction || !game) {
    return { points: 0, exact: 0 };
  }

  const pa = prediction.predicted_score_a;
  const pb = prediction.predicted_score_b;
  const ra = game.official_score_a;
  const rb = game.official_score_b;

  // Missing data
  if (pa === null || pb === null || ra === null || rb === null) {
    return { points: 0, exact: 0 };
  }

  // Exact score
  if (pa === ra && pb === rb) {
    return { points: SCORING_RULES.EXACT_SCORE, exact: 1 };
  }

  let points = 0;

  // Correct outcome
  if (getOutcome(pa, pb) === getOutcome(ra, rb)) {
    points += SCORING_RULES.CORRECT_OUTCOME;
  }

  // Correct team scores
  if (pa === ra) points += SCORING_RULES.CORRECT_TEAM_SCORE;
  if (pb === rb) points += SCORING_RULES.CORRECT_TEAM_SCORE;

  return { points, exact: 0 };
}

/**
 * Validates if a prediction is complete
 * @param prediction - The prediction to validate
 * @returns True if both scores are not null
 */
export function isPredictionComplete(prediction: Prediction): boolean {
  return (
    prediction.predicted_score_a !== null &&
    prediction.predicted_score_b !== null
  );
}

/**
 * Validates if a prediction is empty
 * @param prediction - The prediction to validate
 * @returns True if both scores are null
 */
export function isPredictionEmpty(prediction: Prediction): boolean {
  return (
    prediction.predicted_score_a === null &&
    prediction.predicted_score_b === null
  );
}
