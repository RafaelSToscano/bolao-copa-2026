import { describe, it, expect } from "vitest";
import { MOCK_PLAYERS, MOCK_GAMES, MOCK_PREDICTIONS } from "../index";
import { getLiveGames } from "@/lib/liveGames";

describe("mock data fixtures", () => {
  it("has at least 10 players", () => {
    expect(MOCK_PLAYERS.length).toBeGreaterThanOrEqual(10);
    expect(MOCK_PLAYERS.some((p) => p.is_admin)).toBe(true);
  });

  it("each player has unique id and access_code", () => {
    const ids = new Set(MOCK_PLAYERS.map((p) => p.id));
    const codes = new Set(MOCK_PLAYERS.map((p) => p.access_code));
    expect(ids.size).toBe(MOCK_PLAYERS.length);
    expect(codes.size).toBe(MOCK_PLAYERS.length);
  });

  it("has 72 group-stage games", () => {
    expect(MOCK_GAMES).toHaveLength(72);
    expect(MOCK_GAMES.every((g) => g.team_a && g.team_b)).toBe(true);
  });

  it("each game has both teams and a match_date", () => {
    MOCK_GAMES.forEach((game) => {
      expect(game.team_a).toBeTruthy();
      expect(game.team_b).toBeTruthy();
      expect(game.match_date).toBeTruthy();
      expect(game.team_a).not.toBe(game.team_b);
    });
  });

  it("has exactly two live games (the deliberately pinned slots)", () => {
    const live = getLiveGames(MOCK_GAMES);
    expect(live).toHaveLength(2);
  });

  it("has finished games (with official scores)", () => {
    const finished = MOCK_GAMES.filter(
      (g) => g.official_score_a !== null && g.official_score_b !== null
    );
    expect(finished.length).toBeGreaterThan(0);
  });

  it("has upcoming games", () => {
    const now = Date.now();
    const upcoming = MOCK_GAMES.filter((g) => {
      if (!g.match_date) return false;
      return (
        new Date(g.match_date).getTime() > now &&
        g.official_score_a === null &&
        g.official_score_b === null
      );
    });
    expect(upcoming.length).toBeGreaterThan(0);
  });

  it("has one prediction per (player, game) pair", () => {
    expect(MOCK_PREDICTIONS).toHaveLength(MOCK_PLAYERS.length * MOCK_GAMES.length);

    const validPlayers = new Set(MOCK_PLAYERS.map((p) => p.id));
    const validGames = new Set(MOCK_GAMES.map((g) => g.id));

    MOCK_PREDICTIONS.forEach((p) => {
      expect(validPlayers.has(p.player_id)).toBe(true);
      expect(validGames.has(p.game_id)).toBe(true);
      expect(p.predicted_score_a).not.toBeNull();
      expect(p.predicted_score_b).not.toBeNull();
    });
  });

  it("groups can be derived from games (12 groups)", () => {
    const groups = new Set(MOCK_GAMES.map((g) => g.group_name));
    expect(groups.size).toBe(12);
  });
});
