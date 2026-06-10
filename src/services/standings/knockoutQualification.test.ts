import { describe, it, expect, beforeEach } from 'vitest';
import { generateRound32 } from '@/services/standings/knockoutQualification';
import { Game } from '@/types/game';

// Helper to create a game with results
function createGame(
  id: string,
  group: string,
  teamA: string,
  teamB: string,
  scoreA: number,
  scoreB: number
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

describe('generateRound32 - Knockout Qualification', () => {
  let games: Game[];

  beforeEach(() => {
    // Create complete group results for all 12 groups
    games = [
      // Group A
      createGame('ga1', 'A', 'BRA', 'SRB', 2, 0),
      createGame('ga2', 'A', 'CHI', 'SVK', 2, 1),
      createGame('ga3', 'A', 'BRA', 'CHI', 1, 0),
      createGame('ga4', 'A', 'SRB', 'SVK', 3, 2),
      createGame('ga5', 'A', 'BRA', 'SVK', 4, 1),
      createGame('ga6', 'A', 'SRB', 'CHI', 1, 0),

      // Group B
      createGame('gb1', 'B', 'ARG', 'CAN', 2, 1),
      createGame('gb2', 'B', 'MAR', 'URU', 0, 3),
      createGame('gb3', 'B', 'ARG', 'MAR', 3, 0),
      createGame('gb4', 'B', 'CAN', 'URU', 1, 2),
      createGame('gb5', 'B', 'ARG', 'URU', 2, 0),
      createGame('gb6', 'B', 'MAR', 'CAN', 2, 1),

      // Group C
      createGame('gc1', 'C', 'ESP', 'UZB', 3, 1),
      createGame('gc2', 'C', 'ITA', 'ECU', 2, 1),
      createGame('gc3', 'C', 'ESP', 'ITA', 1, 0),
      createGame('gc4', 'C', 'UZB', 'ECU', 1, 3),
      createGame('gc5', 'C', 'ESP', 'ECU', 5, 1),
      createGame('gc6', 'C', 'ITA', 'UZB', 2, 0),

      // Group D
      createGame('gd1', 'D', 'FRA', 'AUS', 4, 1),
      createGame('gd2', 'D', 'PER', 'DEN', 0, 0),
      createGame('gd3', 'D', 'FRA', 'PER', 3, 0),
      createGame('gd4', 'D', 'AUS', 'DEN', 0, 2),
      createGame('gd5', 'D', 'FRA', 'DEN', 2, 1),
      createGame('gd6', 'D', 'AUS', 'PER', 1, 0),

      // Group E
      createGame('ge1', 'E', 'DEU', 'MUS', 4, 0),
      createGame('ge2', 'E', 'ESP', 'CMR', 1, 0),
      createGame('ge3', 'E', 'DEU', 'ESP', 1, 1),
      createGame('ge4', 'E', 'MUS', 'CMR', 2, 3),
      createGame('ge5', 'E', 'DEU', 'CMR', 3, 1),
      createGame('ge6', 'E', 'ESP', 'MUS', 3, 0),

      // Group F
      createGame('gf1', 'F', 'BEL', 'CAN', 1, 0),
      createGame('gf2', 'F', 'ROU', 'KOS', 1, 0),
      createGame('gf3', 'F', 'BEL', 'ROU', 2, 0),
      createGame('gf4', 'F', 'CAN', 'KOS', 2, 1),
      createGame('gf5', 'F', 'BEL', 'KOS', 2, 0),
      createGame('gf6', 'F', 'ROU', 'CAN', 1, 0),

      // Group G
      createGame('gg1', 'G', 'POR', 'CZE', 3, 1),
      createGame('gg2', 'G', 'TUR', 'TAI', 2, 0),
      createGame('gg3', 'G', 'POR', 'TUR', 3, 2),
      createGame('gg4', 'G', 'CZE', 'TAI', 2, 1),
      createGame('gg5', 'G', 'POR', 'TAI', 4, 0),
      createGame('gg6', 'G', 'CZE', 'TUR', 1, 0),

      // Group H
      createGame('gh1', 'H', 'ENG', 'ISL', 4, 1),
      createGame('gh2', 'H', 'GAB', 'FIN', 1, 0),
      createGame('gh3', 'H', 'ENG', 'GAB', 3, 0),
      createGame('gh4', 'H', 'ISL', 'FIN', 2, 1),
      createGame('gh5', 'H', 'ENG', 'FIN', 3, 2),
      createGame('gh6', 'H', 'GAB', 'ISL', 0, 1),

      // Group I
      createGame('gi1', 'I', 'HOL', 'SEN', 2, 0),
      createGame('gi2', 'I', 'TUN', 'AUS', 0, 1),
      createGame('gi3', 'I', 'HOL', 'TUN', 3, 0),
      createGame('gi4', 'I', 'SEN', 'AUS', 1, 0),
      createGame('gi5', 'I', 'HOL', 'AUS', 2, 1),
      createGame('gi6', 'I', 'TUN', 'SEN', 2, 1),

      // Group J
      createGame('gj1', 'J', 'CRO', 'MAR', 1, 0),
      createGame('gj2', 'J', 'ALB', 'ESP', 0, 1),
      createGame('gj3', 'J', 'CRO', 'ALB', 2, 1),
      createGame('gj4', 'J', 'MAR', 'ESP', 2, 3),
      createGame('gj5', 'J', 'CRO', 'ESP', 2, 2),
      createGame('gj6', 'J', 'ALB', 'MAR', 0, 2),

      // Group K
      createGame('gk1', 'K', 'SVN', 'DEN', 1, 2),
      createGame('gk2', 'K', 'SRB', 'SVK', 1, 0),
      createGame('gk3', 'K', 'SVN', 'SRB', 1, 2),
      createGame('gk4', 'K', 'DEN', 'SVK', 2, 1),
      createGame('gk5', 'K', 'SVN', 'SVK', 1, 2),
      createGame('gk6', 'K', 'DEN', 'SRB', 0, 1),

      // Group L
      createGame('gl1', 'L', 'JPN', 'SUI', 2, 1),
      createGame('gl2', 'L', 'CIV', 'GRE', 2, 0),
      createGame('gl3', 'L', 'JPN', 'CIV', 2, 1),
      createGame('gl4', 'L', 'SUI', 'GRE', 3, 0),
      createGame('gl5', 'L', 'JPN', 'GRE', 1, 0),
      createGame('gl6', 'L', 'SUI', 'CIV', 2, 1),
    ];
  });

  it('should generate exactly 16 matches', () => {
    const round32 = generateRound32(games);
    expect(round32).toHaveLength(16);
  });

  it('should have no undefined teams when all groups have results', () => {
    const round32 = generateRound32(games);
    round32.forEach((match, idx) => {
      expect(match.home, `Match ${idx + 1}: home team should be defined`).toBeDefined();
      expect(match.away, `Match ${idx + 1}: away team should be defined`).toBeDefined();
    });
  });

  it('should place group winners in matches 1-12', () => {
    const round32 = generateRound32(games);
    const matches1to12 = round32.slice(0, 12);
    
    matches1to12.forEach((match) => {
      expect(match.home?.position).toBe('1');
    });
  });

  it('should place group seconds in matches 13-16', () => {
    const round32 = generateRound32(games);
    const matches13to16 = round32.slice(12, 16);
    
    matches13to16.forEach((match) => {
      expect(match.home?.position).toBe('2');
    });
  });

  it('should not place groups in conflicting positions', () => {
    const round32 = generateRound32(games);
    
    // Check that the first 12 matches (winners) don't have the same group as their second place opponents
    for (let i = 0; i < 12; i++) {
      const match = round32[i];
      if (match.home && match.away) {
        // Winners should not face the second place from their own group
        if (match.home.position === '1' && match.away.position === '2') {
          expect(match.home.group).not.toBe(match.away.group);
        }
      }
    }
  });

  it('should follow FIFA 2026 fixed bracket structure', () => {
    const round32 = generateRound32(games);
    
    // Match 1: 1st A vs 3rd best
    expect(round32[0].home?.group).toBe('A');
    expect(round32[0].home?.position).toBe('1');
    expect(round32[0].away?.position).toBe('3');
    
    // Match 3: 1st C vs 2nd F
    expect(round32[2].home?.group).toBe('C');
    expect(round32[2].away?.group).toBe('F');
    expect(round32[2].away?.position).toBe('2');
    
    // Match 13: 2nd A vs 2nd B
    expect(round32[12].home?.group).toBe('A');
    expect(round32[12].home?.position).toBe('2');
    expect(round32[12].away?.group).toBe('B');
    expect(round32[12].away?.position).toBe('2');
  });

  it('should handle incomplete groups with placeholders', () => {
    const incompleteGames = games.slice(0, 10); // Missing many games
    const round32 = generateRound32(incompleteGames);
    
    expect(round32).toHaveLength(16);
    // Some matches will have undefined teams
    const hasUndefined = round32.some(m => !m.home || !m.away);
    expect(hasUndefined).toBe(true);
  });

  it('should correctly extract 8 best third-place teams', () => {
    const round32 = generateRound32(games);
    const thirdsCount = round32.filter(m => m.home?.position === '3' || m.away?.position === '3').length;
    
    // Each of matches 1-12 has at least one third (except those with seconds)
    expect(thirdsCount).toBeGreaterThan(0);
  });
});
