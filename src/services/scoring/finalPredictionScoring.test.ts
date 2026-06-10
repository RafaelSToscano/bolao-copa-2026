import { describe, it, expect } from 'vitest';
import { calculateFinalPredictionPoints } from '@/services/scoring/finalPredictionScoring';
import { FinalPrediction } from '@/services/supabase/finalPredictionsService';
import { TournamentResult } from '@/services/supabase/tournamentResultService';

const makeResult = (
  champion: string,
  runner_up: string,
  third_place: string
): TournamentResult => ({ id: 1, champion, runner_up, third_place });

const makePrediction = (
  champion: string | null,
  runner_up: string | null,
  third_place: string | null
): FinalPrediction => ({
  player_id: 'player1',
  champion,
  runner_up,
  third_place,
});

describe('calculateFinalPredictionPoints', () => {
  it('returns 0 when prediction is null', () => {
    expect(calculateFinalPredictionPoints(null, makeResult('Brasil', 'Argentina', 'França'))).toBe(0);
  });

  it('returns 0 when result is null', () => {
    expect(calculateFinalPredictionPoints(makePrediction('Brasil', 'Argentina', 'França'), null)).toBe(0);
  });

  it('returns 0 when both are null', () => {
    expect(calculateFinalPredictionPoints(null, null)).toBe(0);
  });

  it('awards 40 points for correct champion', () => {
    const result = makeResult('Brasil', 'Argentina', 'França');
    const prediction = makePrediction('Brasil', 'Alemanha', 'Espanha');
    expect(calculateFinalPredictionPoints(prediction, result)).toBe(40);
  });

  it('awards 25 points for correct runner-up', () => {
    const result = makeResult('Brasil', 'Argentina', 'França');
    const prediction = makePrediction('Alemanha', 'Argentina', 'Espanha');
    expect(calculateFinalPredictionPoints(prediction, result)).toBe(25);
  });

  it('awards 15 points for correct third place', () => {
    const result = makeResult('Brasil', 'Argentina', 'França');
    const prediction = makePrediction('Alemanha', 'Espanha', 'França');
    expect(calculateFinalPredictionPoints(prediction, result)).toBe(15);
  });

  it('awards 65 points for correct champion and runner-up', () => {
    const result = makeResult('Brasil', 'Argentina', 'França');
    const prediction = makePrediction('Brasil', 'Argentina', 'Espanha');
    expect(calculateFinalPredictionPoints(prediction, result)).toBe(65);
  });

  it('awards 55 points for correct champion and third place', () => {
    const result = makeResult('Brasil', 'Argentina', 'França');
    const prediction = makePrediction('Brasil', 'Espanha', 'França');
    expect(calculateFinalPredictionPoints(prediction, result)).toBe(55);
  });

  it('awards 40 points for correct runner-up and third place', () => {
    const result = makeResult('Brasil', 'Argentina', 'França');
    const prediction = makePrediction('Alemanha', 'Argentina', 'França');
    expect(calculateFinalPredictionPoints(prediction, result)).toBe(40);
  });

  it('awards 80 points for all three correct', () => {
    const result = makeResult('Brasil', 'Argentina', 'França');
    const prediction = makePrediction('Brasil', 'Argentina', 'França');
    expect(calculateFinalPredictionPoints(prediction, result)).toBe(80);
  });

  it('awards 0 points when everything is wrong', () => {
    const result = makeResult('Brasil', 'Argentina', 'França');
    const prediction = makePrediction('Alemanha', 'Espanha', 'Portugal');
    expect(calculateFinalPredictionPoints(prediction, result)).toBe(0);
  });

  it('returns 0 when prediction fields are null', () => {
    const result = makeResult('Brasil', 'Argentina', 'França');
    const prediction = makePrediction(null, null, null);
    expect(calculateFinalPredictionPoints(prediction, result)).toBe(0);
  });

  it('does not award champion points for runner-up match', () => {
    const result = makeResult('Brasil', 'Argentina', 'França');
    const prediction = makePrediction('Argentina', 'Brasil', 'França');
    // champion wrong, runner_up wrong, third_place correct
    expect(calculateFinalPredictionPoints(prediction, result)).toBe(15);
  });
});
