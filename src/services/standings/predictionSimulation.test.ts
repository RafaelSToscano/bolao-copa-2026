import { describe, it, expect } from 'vitest';
import {
  buildGamesFromPredictions,
  calculateGroupStandingsFromPredictions,
} from '@/services/standings/predictionSimulation';
import { Game } from '@/types/game';
import { Prediction } from '@/types/prediction';

const makeGame = (id: string, overrides: Partial<Game> = {}): Game => ({
  id,
  phase: 'groups',
  group_name: 'A',
  match_order: 1,
  match_date: '2026-06-11T19:00:00+00:00',
  team_a: 'Brasil',
  team_b: 'México',
  official_score_a: null,
  official_score_b: null,
  locked: false,
  ...overrides,
});

const makePrediction = (
  playerId: string,
  gameId: string,
  scoreA: number | null,
  scoreB: number | null
): Prediction => ({
  id: `${playerId}-${gameId}`,
  player_id: playerId,
  game_id: gameId,
  predicted_score_a: scoreA,
  predicted_score_b: scoreB,
});

describe('buildGamesFromPredictions', () => {
  const games = [
    makeGame('g1', { team_a: 'Brasil', team_b: 'México', match_order: 1 }),
    makeGame('g2', { team_a: 'Argentina', team_b: 'França', match_order: 2 }),
  ];

  it('replaces official scores with player predictions', () => {
    const predictions = [
      makePrediction('p1', 'g1', 2, 1),
      makePrediction('p1', 'g2', 0, 3),
    ];

    const result = buildGamesFromPredictions(games, predictions, 'p1');
    expect(result[0].official_score_a).toBe(2);
    expect(result[0].official_score_b).toBe(1);
    expect(result[1].official_score_a).toBe(0);
    expect(result[1].official_score_b).toBe(3);
  });

  it('sets null for games with no prediction', () => {
    const result = buildGamesFromPredictions(games, [], 'p1');
    expect(result[0].official_score_a).toBeNull();
    expect(result[0].official_score_b).toBeNull();
  });

  it('only uses predictions for the specified player', () => {
    const predictions = [
      makePrediction('p1', 'g1', 2, 1),
      makePrediction('p2', 'g1', 5, 0),
    ];
    const result = buildGamesFromPredictions(games, predictions, 'p1');
    expect(result[0].official_score_a).toBe(2);
    expect(result[0].official_score_b).toBe(1);
  });

  it('preserves all other game fields', () => {
    const predictions = [makePrediction('p1', 'g1', 1, 0)];
    const result = buildGamesFromPredictions(games, predictions, 'p1');
    expect(result[0].team_a).toBe('Brasil');
    expect(result[0].team_b).toBe('México');
    expect(result[0].id).toBe('g1');
  });

  it('handles empty games array', () => {
    expect(buildGamesFromPredictions([], [], 'p1')).toEqual([]);
  });

  it('sets null when prediction scores are null', () => {
    const predictions = [makePrediction('p1', 'g1', null, null)];
    const result = buildGamesFromPredictions(games, predictions, 'p1');
    expect(result[0].official_score_a).toBeNull();
    expect(result[0].official_score_b).toBeNull();
  });
});

describe('calculateGroupStandingsFromPredictions', () => {
  const groupGames = [
    makeGame('g1', { team_a: 'Brasil', team_b: 'México', match_order: 1 }),
    makeGame('g2', { team_a: 'Argentina', team_b: 'França', match_order: 2 }),
    makeGame('g3', { team_a: 'Brasil', team_b: 'Argentina', match_order: 3 }),
    makeGame('g4', { team_a: 'México', team_b: 'França', match_order: 4 }),
    makeGame('g5', { team_a: 'Brasil', team_b: 'França', match_order: 5 }),
    makeGame('g6', { team_a: 'México', team_b: 'Argentina', match_order: 6 }),
  ];

  it('returns standings based on predictions when no official results', () => {
    const predictions = [
      makePrediction('p1', 'g1', 2, 0),
      makePrediction('p1', 'g2', 1, 1),
      makePrediction('p1', 'g3', 1, 0),
      makePrediction('p1', 'g4', 2, 1),
      makePrediction('p1', 'g5', 3, 0),
      makePrediction('p1', 'g6', 0, 2),
    ];

    const standings = calculateGroupStandingsFromPredictions(groupGames, predictions, 'p1');
    expect(standings.length).toBe(4);
    const brasil = standings.find((s) => s.team === 'Brasil');
    expect(brasil).toBeDefined();
    expect(brasil!.wins).toBe(3);
    expect(brasil!.points).toBe(9);
  });

  it('returns empty standings when no predictions exist', () => {
    // Games with null scores are skipped by the standings engine — no teams appear
    const standings = calculateGroupStandingsFromPredictions(groupGames, [], 'p1');
    expect(standings.length).toBe(0);
  });

  it('returns 4 teams for a group of 4', () => {
    const predictions = groupGames.map((g) =>
      makePrediction('p1', g.id, 1, 1)
    );
    const standings = calculateGroupStandingsFromPredictions(groupGames, predictions, 'p1');
    expect(standings.length).toBe(4);
  });
});
