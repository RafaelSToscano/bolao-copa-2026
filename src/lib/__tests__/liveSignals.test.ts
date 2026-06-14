import { describe, it, expect } from "vitest";
import { deriveLiveSignals } from "@/lib/liveSignals";
import { Game } from "@/types/game";
import { LiveScoreMatch } from "@/hooks/useLiveScores";

const NOW = new Date("2026-06-12T20:00:00.000Z").getTime();

function game(overrides: Partial<Game>): Game {
  return {
    id: "g",
    phase: "groups",
    group_name: "A",
    match_order: 1,
    match_date: null,
    team_a: "Brasil",
    team_b: "Argentina",
    official_score_a: null,
    official_score_b: null,
    locked: false,
    ...overrides,
  };
}

function score(overrides: Partial<LiveScoreMatch>): LiveScoreMatch {
  return {
    id: 1,
    utcDate: new Date(NOW).toISOString(),
    status: "IN_PLAY",
    homeTeam: "Brasil",
    awayTeam: "Argentina",
    homeScore: 0,
    awayScore: 0,
    ...overrides,
  };
}

describe("deriveLiveSignals", () => {
  it("flags a game as live when its football-data row is IN_PLAY", () => {
    const games = [
      game({
        id: "live",
        match_date: new Date(NOW - 30 * 60 * 1000).toISOString(),
        team_a: "Brasil",
        team_b: "Argentina",
      }),
    ];
    const liveScores = [
      score({
        utcDate: new Date(NOW - 30 * 60 * 1000).toISOString(),
        status: "IN_PLAY",
      }),
    ];
    const r = deriveLiveSignals(games, liveScores, NOW);
    expect(r.liveGames.map((g) => g.id)).toEqual(["live"]);
  });

  it("ignores FINISHED games even when still inside the 180-min window", () => {
    const games = [
      game({
        id: "done",
        match_date: new Date(NOW - 30 * 60 * 1000).toISOString(),
      }),
    ];
    const liveScores = [
      score({
        utcDate: new Date(NOW - 30 * 60 * 1000).toISOString(),
        status: "FINISHED",
      }),
    ];
    expect(deriveLiveSignals(games, liveScores, NOW).liveGames).toEqual([]);
  });

  it("returns secondsUntilNextKickoff from the soonest TIMED upstream match", () => {
    const games: Game[] = [];
    const liveScores = [
      score({
        utcDate: new Date(NOW + 30 * 60 * 1000).toISOString(),
        status: "TIMED",
        homeTeam: "X",
        awayTeam: "Y",
      }),
      score({
        utcDate: new Date(NOW + 5 * 60 * 1000).toISOString(),
        status: "SCHEDULED",
        homeTeam: "A",
        awayTeam: "B",
      }),
      score({
        utcDate: new Date(NOW + 60 * 60 * 1000).toISOString(),
        status: "TIMED",
        homeTeam: "C",
        awayTeam: "D",
      }),
    ];
    const r = deriveLiveSignals(games, liveScores, NOW);
    expect(r.secondsUntilNextKickoff).toBe(5 * 60);
  });

  it("returns null secondsUntilNextKickoff when no upcoming matches", () => {
    const r = deriveLiveSignals([], [], NOW);
    expect(r.secondsUntilNextKickoff).toBeNull();
  });

  it("ignores past TIMED matches (negative diffs)", () => {
    const liveScores = [
      score({
        utcDate: new Date(NOW - 60 * 1000).toISOString(),
        status: "TIMED",
      }),
    ];
    expect(deriveLiveSignals([], liveScores, NOW).secondsUntilNextKickoff).toBeNull();
  });

  it("surfaces unmatched IN_PLAY upstream rows so they can render as slim live cards", () => {
    const games: Game[] = [];
    const liveScores = [
      score({
        id: 99,
        utcDate: new Date(NOW - 30 * 60 * 1000).toISOString(),
        status: "IN_PLAY",
        homeTeam: "Estados Unidos",
        awayTeam: "Paraguai",
      }),
    ];
    const r = deriveLiveSignals(games, liveScores, NOW);
    expect(r.liveGames).toEqual([]);
    expect(r.unmatchedLiveScores.map((m) => m.id)).toEqual([99]);
  });

  it("does not duplicate matched live rows in unmatchedLiveScores", () => {
    const games = [
      game({
        id: "live",
        match_date: new Date(NOW - 30 * 60 * 1000).toISOString(),
        team_a: "Brasil",
        team_b: "Argentina",
      }),
    ];
    const liveScores = [
      score({
        id: 1,
        utcDate: new Date(NOW - 30 * 60 * 1000).toISOString(),
        status: "IN_PLAY",
      }),
    ];
    const r = deriveLiveSignals(games, liveScores, NOW);
    expect(r.liveGames.map((g) => g.id)).toEqual(["live"]);
    expect(r.unmatchedLiveScores).toEqual([]);
  });
});

