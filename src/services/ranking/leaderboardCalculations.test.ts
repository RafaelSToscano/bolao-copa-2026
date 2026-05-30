import { describe, it, expect } from 'vitest';
import { calculateRanking } from '@/services/ranking/leaderboardCalculations';
import { Player } from '@/types/player';
import { Game } from '@/types/game';
import { Prediction } from '@/types/prediction';

describe('Leaderboard Calculations', () => {
  describe('calculateRanking', () => {
    const mockPlayers: Player[] = [
      {
        id: 'player1',
        name: 'João',
        access_code: 'code1',
        is_admin: false,
        approved: true,
      },
      {
        id: 'player2',
        name: 'Maria',
        access_code: 'code2',
        is_admin: false,
        approved: true,
      },
      {
        id: 'player3',
        name: 'Pedro',
        access_code: 'code3',
        is_admin: false,
        approved: true,
      },
    ];

    const mockGames: Game[] = [
      {
        id: 'game1',
        phase: 'group',
        group_name: 'A',
        match_order: 1,
        match_date: '2026-06-20',
        team_a: 'Brazil',
        team_b: 'Mexico',
        official_score_a: 2,
        official_score_b: 1,
        locked: true,
      },
      {
        id: 'game2',
        phase: 'group',
        group_name: 'A',
        match_order: 2,
        match_date: '2026-06-21',
        team_a: 'Canada',
        team_b: 'USA',
        official_score_a: 1,
        official_score_b: 1,
        locked: true,
      },
      {
        id: 'game3',
        phase: 'group',
        group_name: 'B',
        match_order: 3,
        match_date: '2026-06-22',
        team_a: 'Germany',
        team_b: 'France',
        official_score_a: 3,
        official_score_b: 2,
        locked: true,
      },
    ];

    it('should return empty array when no players provided', () => {
      const ranking = calculateRanking([], mockGames, []);
      expect(ranking).toEqual([]);
    });

    it('should return players with 0 total and 0 exacts when no predictions', () => {
      const ranking = calculateRanking(mockPlayers, mockGames, []);
      expect(ranking).toHaveLength(3);
      expect(ranking.every((p) => p.total === 0 && p.exacts === 0)).toBe(
        true
      );
    });

    it('should include all player information in ranking', () => {
      const ranking = calculateRanking(mockPlayers, mockGames, []);
      expect(ranking[0]).toHaveProperty('id');
      expect(ranking[0]).toHaveProperty('name');
      expect(ranking[0]).toHaveProperty('total');
      expect(ranking[0]).toHaveProperty('exacts');
    });

    it('should calculate correct total points for player with exact predictions', () => {
      const predictions: Prediction[] = [
        {
          id: 'pred1',
          player_id: 'player1',
          game_id: 'game1',
          predicted_score_a: 2,
          predicted_score_b: 1,
        },
        {
          id: 'pred2',
          player_id: 'player1',
          game_id: 'game2',
          predicted_score_a: 1,
          predicted_score_b: 1,
        },
      ];
      const ranking = calculateRanking(mockPlayers, mockGames, predictions);
      const player1Ranking = ranking.find((p) => p.id === 'player1');
      // Two exact predictions = 15 + 15 = 30 points, 2 exacts
      expect(player1Ranking?.total).toBe(30);
      expect(player1Ranking?.exacts).toBe(2);
    });

    it('should calculate correct points for partial matches', () => {
      const predictions: Prediction[] = [
        {
          id: 'pred1',
          player_id: 'player1',
          game_id: 'game1',
          predicted_score_a: 2,
          predicted_score_b: 0,
        },
      ];
      const ranking = calculateRanking(mockPlayers, mockGames, predictions);
      const player1Ranking = ranking.find((p) => p.id === 'player1');
      // Correct outcome (A wins) = 7 points, correct team A score = 2 points = 9 total
      expect(player1Ranking?.total).toBe(9);
      expect(player1Ranking?.exacts).toBe(0);
    });

    it('should handle mixed predictions for same player', () => {
      const predictions: Prediction[] = [
        // Exact prediction
        {
          id: 'pred1',
          player_id: 'player1',
          game_id: 'game1',
          predicted_score_a: 2,
          predicted_score_b: 1,
        },
        // Correct outcome + team score
        {
          id: 'pred2',
          player_id: 'player1',
          game_id: 'game3',
          predicted_score_a: 3,
          predicted_score_b: 1,
        },
        // Draw prediction vs draw result (correct outcome only)
        {
          id: 'pred3',
          player_id: 'player1',
          game_id: 'game2',
          predicted_score_a: 0,
          predicted_score_b: 0,
        },
      ];
      const ranking = calculateRanking(mockPlayers, mockGames, predictions);
      const player1Ranking = ranking.find((p) => p.id === 'player1');
      // 15 (exact) + 9 (outcome + team score) + 7 (draw outcome) = 31
      expect(player1Ranking?.total).toBe(31);
      expect(player1Ranking?.exacts).toBe(1);
    });

    it('should sort by total points descending', () => {
      const predictions: Prediction[] = [
        {
          id: 'pred1',
          player_id: 'player1',
          game_id: 'game1',
          predicted_score_a: 2,
          predicted_score_b: 1,
        },
        {
          id: 'pred2',
          player_id: 'player2',
          game_id: 'game1',
          predicted_score_a: 2,
          predicted_score_b: 2,
        },
        {
          id: 'pred3',
          player_id: 'player3',
          game_id: 'game1',
          predicted_score_a: 0,
          predicted_score_b: 0,
        },
      ];
      const ranking = calculateRanking(mockPlayers, mockGames, predictions);
      expect(ranking[0].id).toBe('player1'); // 15 points
      expect(ranking[1].id).toBe('player2'); // 9 points
      expect(ranking[2].id).toBe('player3'); // 0 points
    });

    it('should use exacts as tiebreaker when total points are equal', () => {
      const predictions: Prediction[] = [
        {
          id: 'pred1',
          player_id: 'player1',
          game_id: 'game1',
          predicted_score_a: 2,
          predicted_score_b: 1,
        },
        {
          id: 'pred2',
          player_id: 'player1',
          game_id: 'game2',
          predicted_score_a: 1,
          predicted_score_b: 1,
        },
        // player2 has same total (30) but fewer exacts (1)
        {
          id: 'pred3',
          player_id: 'player2',
          game_id: 'game1',
          predicted_score_a: 2,
          predicted_score_b: 1,
        },
        {
          id: 'pred4',
          player_id: 'player2',
          game_id: 'game2',
          predicted_score_a: 2,
          predicted_score_b: 2, // Only outcome + team score
        },
      ];
      const ranking = calculateRanking(mockPlayers, mockGames, predictions);
      expect(ranking[0].id).toBe('player1'); // 30 points, 2 exacts
      expect(ranking[1].id).toBe('player2'); // 30 points, 1 exact
    });

    it('should handle missing predictions for games', () => {
      const predictions: Prediction[] = [
        {
          id: 'pred1',
          player_id: 'player1',
          game_id: 'game1',
          predicted_score_a: 2,
          predicted_score_b: 1,
        },
        // No prediction for game2
        // No prediction for game3
      ];
      const ranking = calculateRanking(mockPlayers, mockGames, predictions);
      const player1Ranking = ranking.find((p) => p.id === 'player1');
      expect(player1Ranking?.total).toBe(15); // Only game1
      expect(player1Ranking?.exacts).toBe(1);
    });

    it('should handle null predictions correctly', () => {
      const predictions: Prediction[] = [
        {
          id: 'pred1',
          player_id: 'player1',
          game_id: 'game1',
          predicted_score_a: null,
          predicted_score_b: null,
        },
      ];
      const ranking = calculateRanking(mockPlayers, mockGames, predictions);
      const player1Ranking = ranking.find((p) => p.id === 'player1');
      expect(player1Ranking?.total).toBe(0);
      expect(player1Ranking?.exacts).toBe(0);
    });

    it('should correctly rank multiple players with varied predictions', () => {
      const predictions: Prediction[] = [
        // Player 1: 2 exacts = 30 points
        {
          id: 'pred1',
          player_id: 'player1',
          game_id: 'game1',
          predicted_score_a: 2,
          predicted_score_b: 1,
        },
        {
          id: 'pred2',
          player_id: 'player1',
          game_id: 'game2',
          predicted_score_a: 1,
          predicted_score_b: 1,
        },
        {
          id: 'pred3',
          player_id: 'player1',
          game_id: 'game3',
          predicted_score_a: 0,
          predicted_score_b: 0,
        },
        // Player 2: 1 exact + 1 partial = 15 + 9 = 24 points
        {
          id: 'pred4',
          player_id: 'player2',
          game_id: 'game1',
          predicted_score_a: 2,
          predicted_score_b: 1,
        },
        {
          id: 'pred5',
          player_id: 'player2',
          game_id: 'game3',
          predicted_score_a: 3,
          predicted_score_b: 1,
        },
        // Player 3: no predictions
      ];
      const ranking = calculateRanking(mockPlayers, mockGames, predictions);
      expect(ranking[0].id).toBe('player1');
      expect(ranking[0].total).toBe(30);
      expect(ranking[1].id).toBe('player2');
      expect(ranking[1].total).toBe(24);
      expect(ranking[2].id).toBe('player3');
      expect(ranking[2].total).toBe(0);
    });

    it('should handle games without official scores', () => {
      const gamesWithNull: Game[] = [
        ...mockGames,
        {
          id: 'game4',
          phase: 'group',
          group_name: 'C',
          match_order: 4,
          match_date: '2026-06-23',
          team_a: 'Italy',
          team_b: 'Spain',
          official_score_a: null,
          official_score_b: null,
          locked: false,
        },
      ];
      const predictions: Prediction[] = [
        {
          id: 'pred1',
          player_id: 'player1',
          game_id: 'game4',
          predicted_score_a: 1,
          predicted_score_b: 0,
        },
      ];
      const ranking = calculateRanking(mockPlayers, gamesWithNull, predictions);
      const player1Ranking = ranking.find((p) => p.id === 'player1');
      expect(player1Ranking?.total).toBe(0); // No points for game with null score
    });

    it('should preserve player information in ranking', () => {
      const ranking = calculateRanking(mockPlayers, mockGames, []);
      expect(ranking[0].name).toBe(mockPlayers[0].name);
      expect(ranking[0].is_admin).toBe(mockPlayers[0].is_admin);
      expect(ranking[0].approved).toBe(mockPlayers[0].approved);
    });

    it('should handle large number of games correctly', () => {
      const manyGames: Game[] = Array.from({ length: 100 }, (_, i) => ({
        id: `game${i}`,
        phase: 'group',
        group_name: String.fromCharCode(65 + (i % 26)),
        match_order: i + 1,
        match_date: '2026-06-20',
        team_a: `Team A${i}`,
        team_b: `Team B${i}`,
        official_score_a: 2,
        official_score_b: 1,
        locked: true,
      }));

      const predictions: Prediction[] = Array.from({ length: 100 }, (_, i) => ({
        id: `pred${i}`,
        player_id: 'player1',
        game_id: `game${i}`,
        predicted_score_a: 2,
        predicted_score_b: 1,
      }));

      const ranking = calculateRanking(mockPlayers, manyGames, predictions);
      const player1Ranking = ranking.find((p) => p.id === 'player1');
      expect(player1Ranking?.total).toBe(100 * 15); // 100 exact predictions
      expect(player1Ranking?.exacts).toBe(100);
    });
  });
});
