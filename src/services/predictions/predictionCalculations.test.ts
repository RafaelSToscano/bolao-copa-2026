import { describe, it, expect } from 'vitest';
import {
  getOutcome,
  calculatePredictionPoints,
  isPredictionComplete,
  isPredictionEmpty,
} from '@/services/predictions/predictionCalculations';
import { Prediction, PredictionPoints } from '@/types/prediction';
import { Game } from '@/types/game';
import { SCORING_RULES } from '@/config/scoring';

describe('Prediction Calculations', () => {
  describe('getOutcome', () => {
    it('should return "A" when team A scores more goals', () => {
      expect(getOutcome(2, 1)).toBe('A');
      expect(getOutcome(5, 0)).toBe('A');
      expect(getOutcome(1, 0)).toBe('A');
    });

    it('should return "B" when team B scores more goals', () => {
      expect(getOutcome(1, 2)).toBe('B');
      expect(getOutcome(0, 5)).toBe('B');
      expect(getOutcome(0, 1)).toBe('B');
    });

    it('should return "E" when the score is a draw', () => {
      expect(getOutcome(0, 0)).toBe('E');
      expect(getOutcome(1, 1)).toBe('E');
      expect(getOutcome(3, 3)).toBe('E');
    });
  });

  describe('calculatePredictionPoints', () => {
    const baseGame: Game = {
      id: 'game1',
      phase: 'group',
      group_name: 'A',
      match_order: 1,
      match_date: '2026-06-20',
      team_a: 'Team A',
      team_b: 'Team B',
      official_score_a: 2,
      official_score_b: 1,
      locked: true,
    };

    it('should return 0 points when prediction is undefined', () => {
      const result = calculatePredictionPoints(undefined, baseGame);
      expect(result).toEqual({ points: 0, exact: 0 });
    });

    it('should return 0 points when game is undefined', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: 2,
        predicted_score_b: 1,
      };
      const result = calculatePredictionPoints(prediction, undefined);
      expect(result).toEqual({ points: 0, exact: 0 });
    });

    it('should return 0 points when prediction scores are null', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: null,
        predicted_score_b: null,
      };
      const result = calculatePredictionPoints(prediction, baseGame);
      expect(result).toEqual({ points: 0, exact: 0 });
    });

    it('should return 0 points when game official scores are null', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: 2,
        predicted_score_b: 1,
      };
      const gameWithNullScore: Game = {
        ...baseGame,
        official_score_a: null,
        official_score_b: null,
      };
      const result = calculatePredictionPoints(prediction, gameWithNullScore);
      expect(result).toEqual({ points: 0, exact: 0 });
    });

    it('should return EXACT_SCORE points for exact match', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: 2,
        predicted_score_b: 1,
      };
      const result = calculatePredictionPoints(prediction, baseGame);
      expect(result).toEqual({
        points: SCORING_RULES.EXACT_SCORE,
        exact: 1,
      });
    });

    it('should return CORRECT_OUTCOME points when only outcome is correct', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: 3,
        predicted_score_b: 0,
      };
      const result = calculatePredictionPoints(prediction, baseGame);
      expect(result).toEqual({
        points: SCORING_RULES.CORRECT_OUTCOME,
        exact: 0,
      });
    });

    it('should return points for correct outcome plus correct team A score', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: 2,
        predicted_score_b: 0,
      };
      const result = calculatePredictionPoints(prediction, baseGame);
      expect(result).toEqual({
        points:
          SCORING_RULES.CORRECT_OUTCOME +
          SCORING_RULES.CORRECT_TEAM_SCORE,
        exact: 0,
      });
    });

    it('should return points for correct outcome plus correct team B score', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: 5,
        predicted_score_b: 1,
      };
      const result = calculatePredictionPoints(prediction, baseGame);
      expect(result).toEqual({
        points:
          SCORING_RULES.CORRECT_OUTCOME +
          SCORING_RULES.CORRECT_TEAM_SCORE,
        exact: 0,
      });
    });

    it('should return points for correct outcome plus both team scores', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: 2,
        predicted_score_b: 1,
      };
      const result = calculatePredictionPoints(prediction, baseGame);
      // This is exact match, so should return EXACT_SCORE
      expect(result).toEqual({
        points: SCORING_RULES.EXACT_SCORE,
        exact: 1,
      });
    });

    it('should return only team score points when outcome is wrong', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: 2,
        predicted_score_b: 2,
      };
      const result = calculatePredictionPoints(prediction, baseGame);
      expect(result).toEqual({
        points: SCORING_RULES.CORRECT_TEAM_SCORE,
        exact: 0,
      });
    });

    it('should return 0 points when prediction is completely wrong', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: 0,
        predicted_score_b: 0,
      };
      const result = calculatePredictionPoints(prediction, baseGame);
      expect(result).toEqual({ points: 0, exact: 0 });
    });

    it('should handle draw prediction vs draw result correctly', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: 1,
        predicted_score_b: 1,
      };
      const drawGame: Game = {
        ...baseGame,
        official_score_a: 2,
        official_score_b: 2,
      };
      const result = calculatePredictionPoints(prediction, drawGame);
      expect(result).toEqual({
        points: SCORING_RULES.CORRECT_OUTCOME,
        exact: 0,
      });
    });

    it('should handle high-scoring games correctly', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: 5,
        predicted_score_b: 4,
      };
      const highScoringGame: Game = {
        ...baseGame,
        official_score_a: 6,
        official_score_b: 3,
      };
      const result = calculatePredictionPoints(prediction, highScoringGame);
      expect(result).toEqual({
        points: SCORING_RULES.CORRECT_OUTCOME,
        exact: 0,
      });
    });
  });

  describe('isPredictionComplete', () => {
    it('should return true when both scores are provided', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: 2,
        predicted_score_b: 1,
      };
      expect(isPredictionComplete(prediction)).toBe(true);
    });

    it('should return false when team A score is null', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: null,
        predicted_score_b: 1,
      };
      expect(isPredictionComplete(prediction)).toBe(false);
    });

    it('should return false when team B score is null', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: 2,
        predicted_score_b: null,
      };
      expect(isPredictionComplete(prediction)).toBe(false);
    });

    it('should return false when both scores are null', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: null,
        predicted_score_b: null,
      };
      expect(isPredictionComplete(prediction)).toBe(false);
    });

    it('should return true for 0-0 prediction', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: 0,
        predicted_score_b: 0,
      };
      expect(isPredictionComplete(prediction)).toBe(true);
    });
  });

  describe('isPredictionEmpty', () => {
    it('should return true when both scores are null', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: null,
        predicted_score_b: null,
      };
      expect(isPredictionEmpty(prediction)).toBe(true);
    });

    it('should return false when team A score is provided', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: 2,
        predicted_score_b: null,
      };
      expect(isPredictionEmpty(prediction)).toBe(false);
    });

    it('should return false when team B score is provided', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: null,
        predicted_score_b: 1,
      };
      expect(isPredictionEmpty(prediction)).toBe(false);
    });

    it('should return false when both scores are provided', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: 2,
        predicted_score_b: 1,
      };
      expect(isPredictionEmpty(prediction)).toBe(false);
    });

    it('should return false for 0-0 prediction', () => {
      const prediction: Prediction = {
        id: 'pred1',
        player_id: 'player1',
        game_id: 'game1',
        predicted_score_a: 0,
        predicted_score_b: 0,
      };
      expect(isPredictionEmpty(prediction)).toBe(false);
    });
  });
});
