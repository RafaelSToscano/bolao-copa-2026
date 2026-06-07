import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKnockout } from '@/hooks/useKnockout';
import { Game } from '@/types/game';
import { Prediction } from '@/types/prediction';

function createGame(
  id: string,
  group: string,
  teamA: string,
  teamB: string,
  scoreA: number | null,
  scoreB: number | null
): Game {
  return {
    id,
    phase: 'groups',
    group_name: group,
    match_order: 1,
    match_date: '2026-06-10',
    team_a: teamA,
    team_b: teamB,
    official_score_a: scoreA,
    official_score_b: scoreB,
    locked: false,
  };
}

function createPrediction(
  gameId: string,
  playerId: string,
  scoreA: number | null,
  scoreB: number | null
): Prediction {
  return {
    game_id: gameId,
    player_id: playerId,
    predicted_score_a: scoreA,
    predicted_score_b: scoreB,
  };
}

describe('useKnockout Hook', () => {
  let games: Game[];
  let predictions: Prediction[];
  const userId = 'player1';

  beforeEach(() => {
    // Create minimal group results
    games = [
      // Group A
      createGame('ga1', 'A', 'BRA', 'SRB', 2, 0),
      createGame('ga2', 'A', 'CHI', 'SVK', 1, 2),
      createGame('ga3', 'A', 'BRA', 'CHI', 1, 0),
      createGame('ga4', 'A', 'SRB', 'SVK', 3, 1),
      createGame('ga5', 'A', 'BRA', 'SVK', 4, 0),
      createGame('ga6', 'A', 'SRB', 'CHI', 1, 0),

      // Group B - minimal
      createGame('gb1', 'B', 'ARG', 'CAN', 2, 1),
      createGame('gb2', 'B', 'MAR', 'URU', 0, 3),
      createGame('gb3', 'B', 'ARG', 'MAR', 3, 0),
      createGame('gb4', 'B', 'CAN', 'URU', 1, 2),
      createGame('gb5', 'B', 'ARG', 'URU', 2, 0),
      createGame('gb6', 'B', 'MAR', 'CAN', 2, 1),

      // Group C through L - all with results
      createGame('gc1', 'C', 'ESP', 'UZB', 3, 1),
      createGame('gc2', 'C', 'ITA', 'ECU', 2, 1),
      createGame('gc3', 'C', 'ESP', 'ITA', 1, 0),
      createGame('gc4', 'C', 'UZB', 'ECU', 1, 3),
      createGame('gc5', 'C', 'ESP', 'ECU', 5, 1),
      createGame('gc6', 'C', 'ITA', 'UZB', 2, 0),

      createGame('gd1', 'D', 'FRA', 'AUS', 4, 1),
      createGame('gd2', 'D', 'PER', 'DEN', 0, 0),
      createGame('gd3', 'D', 'FRA', 'PER', 3, 0),
      createGame('gd4', 'D', 'AUS', 'DEN', 0, 2),
      createGame('gd5', 'D', 'FRA', 'DEN', 2, 1),
      createGame('gd6', 'D', 'AUS', 'PER', 1, 0),

      createGame('ge1', 'E', 'DEU', 'MUS', 4, 0),
      createGame('ge2', 'E', 'CMR', 'NGA', 1, 0),
      createGame('ge3', 'E', 'DEU', 'CMR', 1, 0),
      createGame('ge4', 'E', 'MUS', 'NGA', 2, 3),
      createGame('ge5', 'E', 'DEU', 'NGA', 3, 0),
      createGame('ge6', 'E', 'CMR', 'MUS', 1, 0),

      createGame('gf1', 'F', 'BEL', 'CAN', 1, 0),
      createGame('gf2', 'F', 'ROU', 'KOS', 1, 0),
      createGame('gf3', 'F', 'BEL', 'ROU', 2, 0),
      createGame('gf4', 'F', 'CAN', 'KOS', 2, 1),
      createGame('gf5', 'F', 'BEL', 'KOS', 2, 0),
      createGame('gf6', 'F', 'ROU', 'CAN', 1, 0),

      createGame('gg1', 'G', 'POR', 'CZE', 3, 1),
      createGame('gg2', 'G', 'TUR', 'TAI', 2, 0),
      createGame('gg3', 'G', 'POR', 'TUR', 3, 2),
      createGame('gg4', 'G', 'CZE', 'TAI', 2, 1),
      createGame('gg5', 'G', 'POR', 'TAI', 4, 0),
      createGame('gg6', 'G', 'CZE', 'TUR', 1, 0),

      createGame('gh1', 'H', 'ENG', 'ISL', 4, 1),
      createGame('gh2', 'H', 'GAB', 'FIN', 1, 0),
      createGame('gh3', 'H', 'ENG', 'GAB', 3, 0),
      createGame('gh4', 'H', 'ISL', 'FIN', 2, 1),
      createGame('gh5', 'H', 'ENG', 'FIN', 3, 2),
      createGame('gh6', 'H', 'GAB', 'ISL', 0, 1),

      createGame('gi1', 'I', 'HOL', 'SEN', 2, 0),
      createGame('gi2', 'I', 'TUN', 'AUS', 0, 1),
      createGame('gi3', 'I', 'HOL', 'TUN', 3, 0),
      createGame('gi4', 'I', 'SEN', 'AUS', 1, 0),
      createGame('gi5', 'I', 'HOL', 'AUS', 2, 1),
      createGame('gi6', 'I', 'TUN', 'SEN', 2, 1),

      createGame('gj1', 'J', 'CRO', 'MAR', 1, 0),
      createGame('gj2', 'J', 'ALB', 'ESP', 0, 1),
      createGame('gj3', 'J', 'CRO', 'ALB', 2, 1),
      createGame('gj4', 'J', 'MAR', 'ESP', 2, 3),
      createGame('gj5', 'J', 'CRO', 'ESP', 2, 2),
      createGame('gj6', 'J', 'ALB', 'MAR', 0, 2),

      createGame('gk1', 'K', 'SVN', 'DEN', 1, 2),
      createGame('gk2', 'K', 'SRB', 'SVK', 1, 0),
      createGame('gk3', 'K', 'SVN', 'SRB', 1, 2),
      createGame('gk4', 'K', 'DEN', 'SVK', 2, 1),
      createGame('gk5', 'K', 'SVN', 'SVK', 1, 2),
      createGame('gk6', 'K', 'DEN', 'SRB', 0, 1),

      createGame('gl1', 'L', 'JPN', 'SUI', 2, 1),
      createGame('gl2', 'L', 'CIV', 'GRE', 2, 0),
      createGame('gl3', 'L', 'JPN', 'CIV', 2, 1),
      createGame('gl4', 'L', 'SUI', 'GRE', 3, 0),
      createGame('gl5', 'L', 'JPN', 'GRE', 1, 0),
      createGame('gl6', 'L', 'SUI', 'CIV', 2, 1),
    ];

    predictions = [];
  });

  it('should calculate round32 from official results when no predictions provided', () => {
    const { result } = renderHook(() => useKnockout(games));
    expect(result.current.round32).toHaveLength(16);
    expect(result.current.round32[0].home).toBeDefined();
  });

  it('should calculate round32 from predictions when provided', () => {
    // Create predictions for player
    predictions = games.map((game) =>
      createPrediction(game.id, userId, game.official_score_a || 0, game.official_score_b || 0)
    );

    const { result } = renderHook(() => useKnockout(games, predictions, userId));
    expect(result.current.round32).toHaveLength(16);
    expect(result.current.round32[0].home).toBeDefined();
  });

  it('should return empty when games are empty', () => {
    const { result } = renderHook(() => useKnockout([]));
    expect(result.current.round32).toHaveLength(16);
    // All teams should be undefined
    const hasTeams = result.current.round32.some(m => m.home || m.away);
    expect(hasTeams).toBe(false);
  });

  it('should update round32 when games change', () => {
    const { result, rerender } = renderHook(({ games: g }) => useKnockout(g), {
      initialProps: { games },
    });

    const firstRound = result.current.round32;
    expect(firstRound[0].home).toBeDefined();

    // Change games
    const modifiedGames = [...games];
    modifiedGames[0].official_score_a = 5;

    rerender({ games: modifiedGames });

    // Results should be recalculated
    expect(result.current.round32).toHaveLength(16);
  });

  it('should use predictions over official results when provided', () => {
    // Create predictions with different scores
    predictions = games.map((game, idx) =>
      createPrediction(game.id, userId, (idx % 3) + 1, (idx % 3))
    );

    const { result } = renderHook(() => useKnockout(games, predictions, userId));
    
    // Should still generate a valid bracket
    expect(result.current.round32).toHaveLength(16);
    const firstMatch = result.current.round32[0];
    
    // Should have teams from the predictions
    expect(firstMatch.home || firstMatch.away).toBeDefined();
  });

  it('should handle predictions for only some games', () => {
    // Only add predictions for first half of games
    predictions = games.slice(0, 24).map((game, idx) =>
      createPrediction(game.id, userId, 1, 0)
    );

    const { result } = renderHook(() => useKnockout(games, predictions, userId));
    expect(result.current.round32).toHaveLength(16);
  });
});
