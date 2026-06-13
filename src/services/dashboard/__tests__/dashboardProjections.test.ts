import { describe, it, expect } from "vitest";
import {
  projectRankingTop,
  projectUpcoming,
  projectRecent,
  projectMyStatus,
  projectGroupLeaders,
} from "../dashboardProjections";
import { Game } from "@/types/game";
import { Player } from "@/types/player";
import { Prediction } from "@/types/prediction";

const NOW = new Date("2026-06-12T12:00:00.000Z").getTime();

function game(overrides: Partial<Game>): Game {
  return {
    id: "g",
    phase: "groups",
    group_name: "A",
    match_order: 1,
    match_date: null,
    team_a: "Team A",
    team_b: "Team B",
    official_score_a: null,
    official_score_b: null,
    locked: false,
    ...overrides,
  };
}

function player(id: string, name: string): Player {
  return {
    id,
    name,
    access_code: id,
    is_admin: false,
    approved: true,
  };
}

describe("projectRankingTop", () => {
  it("returns at most topN entries plus the lanterna", () => {
    const players = Array.from({ length: 10 }, (_, i) => player(`p${i}`, `P${i}`));
    const games: Game[] = [];
    const predictions: Prediction[] = [];

    const result = projectRankingTop(players, games, predictions, 5);
    expect(result.top).toHaveLength(5);
    expect(result.lanterna).not.toBeNull();
    expect(result.provisional).toBe(false);
  });

  it("lanterna is null when there are no players", () => {
    const result = projectRankingTop([], [], [], 5);
    expect(result.top).toHaveLength(0);
    expect(result.lanterna).toBeNull();
  });

  it("folds in-progress live scores into ranking points and flags provisional", () => {
    const players = [player("u1", "Me"), player("u2", "Other")];
    const games: Game[] = [
      game({
        id: "live",
        match_date: "2026-06-15T18:00:00.000Z",
      }),
    ];
    const predictions: Prediction[] = [
      {
        player_id: "u1",
        game_id: "live",
        predicted_score_a: 1,
        predicted_score_b: 0,
      },
      {
        player_id: "u2",
        game_id: "live",
        predicted_score_a: 0,
        predicted_score_b: 1,
      },
    ];
    const liveScores = [
      {
        id: 1,
        utcDate: "2026-06-15T18:00:00.000Z",
        status: "IN_PLAY",
        homeTeam: "T",
        awayTeam: "U",
        homeScore: 1,
        awayScore: 0,
      },
    ];

    const result = projectRankingTop(players, games, predictions, 5, liveScores);
    expect(result.provisional).toBe(true);

    const me = result.top.find((r) => r.id === "u1");
    const other = result.top.find((r) => r.id === "u2");
    expect(me?.total).toBe(15); // exact match against live 1-0
    expect(other?.total).toBe(0); // wrong outcome
    expect(me?.position).toBe(1);

    // Both players have officialTotal=0 because the only game is
    // still in-progress (no official score yet). The live ranking
    // moved u1 above u2 — u1 climbs from a tied DB position to live
    // 1st, so its officialPosition reflects the DB tie at position 1.
    expect(me?.officialTotal).toBe(0);
    expect(other?.officialTotal).toBe(0);
  });

  it("returns officialPosition === position when no live scores apply", () => {
    const players = [player("u1", "Me"), player("u2", "Other")];
    const games: Game[] = [
      game({
        id: "g1",
        official_score_a: 2,
        official_score_b: 0,
      }),
    ];
    const predictions: Prediction[] = [
      {
        player_id: "u1",
        game_id: "g1",
        predicted_score_a: 2,
        predicted_score_b: 0,
      },
      {
        player_id: "u2",
        game_id: "g1",
        predicted_score_a: 0,
        predicted_score_b: 2,
      },
    ];
    const result = projectRankingTop(players, games, predictions, 5);
    expect(result.provisional).toBe(false);
    expect(result.top.every((r) => r.position === r.officialPosition)).toBe(true);
    expect(result.top.every((r) => r.total === r.officialTotal)).toBe(true);
  });

  it("populates lastRoundDelta from completed-round movement", () => {
    // Round 1 (older date): p1 nails it, p2 misses → p1 leads.
    // Round 2 (latest date, two games): p2 nails both, p1 misses
    // both → p2 jumps ahead in the final standing.
    const players = [player("p1", "P1"), player("p2", "P2")];
    const games: Game[] = [
      game({
        id: "r1",
        match_date: "2026-06-10T18:00:00.000Z",
        official_score_a: 2,
        official_score_b: 0,
      }),
      game({
        id: "r2a",
        match_date: "2026-06-12T15:00:00.000Z",
        official_score_a: 1,
        official_score_b: 1,
      }),
      game({
        id: "r2b",
        match_date: "2026-06-12T18:00:00.000Z",
        official_score_a: 3,
        official_score_b: 0,
      }),
    ];
    const predictions: Prediction[] = [
      { player_id: "p1", game_id: "r1", predicted_score_a: 2, predicted_score_b: 0 },
      { player_id: "p2", game_id: "r1", predicted_score_a: 0, predicted_score_b: 2 },
      { player_id: "p1", game_id: "r2a", predicted_score_a: 0, predicted_score_b: 0 },
      { player_id: "p2", game_id: "r2a", predicted_score_a: 1, predicted_score_b: 1 },
      { player_id: "p1", game_id: "r2b", predicted_score_a: 0, predicted_score_b: 3 },
      { player_id: "p2", game_id: "r2b", predicted_score_a: 3, predicted_score_b: 0 },
    ];

    const result = projectRankingTop(players, games, predictions, 5);
    const p1 = result.top.find((r) => r.id === "p1");
    const p2 = result.top.find((r) => r.id === "p2");
    expect(p2?.position).toBe(1);
    expect(p2?.lastRoundDelta).toBe(1); // climbed from 2nd → 1st
    expect(p1?.lastRoundDelta).toBe(-1); // dropped from 1st → 2nd
  });

  it("lastRoundDelta is 0 when no round has been scored", () => {
    const players = [player("p1", "P1"), player("p2", "P2")];
    const result = projectRankingTop(players, [], [], 5);
    expect(result.top.every((r) => r.lastRoundDelta === 0)).toBe(true);
  });

  it("does not modify games whose official score is already set", () => {
    const players = [player("u1", "Me")];
    const games: Game[] = [
      game({
        id: "final",
        match_date: "2026-06-10T18:00:00.000Z",
        official_score_a: 2,
        official_score_b: 0,
      }),
    ];
    const predictions: Prediction[] = [
      {
        player_id: "u1",
        game_id: "final",
        predicted_score_a: 2,
        predicted_score_b: 0,
      },
    ];
    const liveScores = [
      {
        id: 1,
        utcDate: "2026-06-10T18:00:00.000Z",
        status: "FINISHED",
        homeTeam: "X",
        awayTeam: "Y",
        homeScore: 5,
        awayScore: 5,
      },
    ];

    const result = projectRankingTop(players, games, predictions, 5, liveScores);
    expect(result.provisional).toBe(false);
    expect(result.top[0].total).toBe(15);
  });
});

describe("projectUpcoming", () => {
  it("filters out finished and past games, sorts ascending, respects limit", () => {
    const games: Game[] = [
      game({
        id: "u3",
        match_date: new Date(NOW + 3 * 60 * 60 * 1000).toISOString(),
      }),
      game({
        id: "u1",
        match_date: new Date(NOW + 1 * 60 * 60 * 1000).toISOString(),
      }),
      game({
        id: "u2",
        match_date: new Date(NOW + 2 * 60 * 60 * 1000).toISOString(),
      }),
      game({
        id: "past",
        match_date: new Date(NOW - 10 * 60 * 1000).toISOString(),
      }),
      game({
        id: "finished",
        match_date: new Date(NOW + 10 * 60 * 1000).toISOString(),
        official_score_a: 1,
        official_score_b: 0,
      }),
      game({
        id: "u4",
        match_date: new Date(NOW + 4 * 60 * 60 * 1000).toISOString(),
      }),
    ];
    const result = projectUpcoming(games, 3, NOW);
    expect(result.games.map((g) => g.id)).toEqual(["u1", "u2", "u3"]);
  });

  it("spans multiple match days up to the limit (default 5)", () => {
    const dayOffset = (days: number, hours: number) =>
      new Date(NOW + days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000)
        .toISOString();

    const games: Game[] = [
      game({ id: "d0-1", match_date: dayOffset(0, 1) }),
      game({ id: "d0-2", match_date: dayOffset(0, 4) }),
      game({ id: "d2-1", match_date: dayOffset(2, 13) }),
      game({ id: "d3-1", match_date: dayOffset(3, 13) }),
      game({ id: "d3-2", match_date: dayOffset(3, 16) }),
      game({ id: "d4-1", match_date: dayOffset(4, 13) }),
    ];
    expect(projectUpcoming(games, 5, NOW).games.map((g) => g.id)).toEqual([
      "d0-1",
      "d0-2",
      "d2-1",
      "d3-1",
      "d3-2",
    ]);
  });

  it("returns empty when nothing is upcoming", () => {
    const games: Game[] = [
      game({
        id: "past",
        match_date: new Date(NOW - 60 * 60 * 1000).toISOString(),
      }),
      game({
        id: "finished",
        match_date: new Date(NOW + 60 * 60 * 1000).toISOString(),
        official_score_a: 0,
        official_score_b: 0,
      }),
    ];
    expect(projectUpcoming(games, 5, NOW).games).toEqual([]);
  });
});

describe("projectRecent", () => {
  it("returns finished games desc with my prediction and points", () => {
    const games: Game[] = [
      game({
        id: "g1",
        match_date: new Date(NOW - 24 * 60 * 60 * 1000).toISOString(),
        official_score_a: 1,
        official_score_b: 0,
      }),
      game({
        id: "g2",
        match_date: new Date(NOW - 12 * 60 * 60 * 1000).toISOString(),
        official_score_a: 2,
        official_score_b: 2,
      }),
      game({
        id: "g3",
        match_date: new Date(NOW + 1 * 60 * 60 * 1000).toISOString(),
      }),
    ];
    const predictions: Prediction[] = [
      {
        player_id: "u1",
        game_id: "g1",
        predicted_score_a: 1,
        predicted_score_b: 0,
      },
    ];
    const result = projectRecent(games, predictions, "u1", 5);
    expect(result.items.map((i) => i.game.id)).toEqual(["g2", "g1"]);
    expect(result.items[1].myPoints).toBe(15);
    expect(result.items[0].myPrediction).toBeNull();
  });

  it("respects limit", () => {
    const games: Game[] = Array.from({ length: 8 }, (_, i) =>
      game({
        id: `g${i}`,
        match_date: new Date(NOW - (i + 1) * 60 * 60 * 1000).toISOString(),
        official_score_a: 1,
        official_score_b: 0,
      })
    );
    const result = projectRecent(games, [], null, 5);
    expect(result.items).toHaveLength(5);
  });
});

describe("projectMyStatus", () => {
  it("returns position, total, exacts, completion %", () => {
    const players = [player("u1", "Me"), player("u2", "Other")];
    const games: Game[] = [
      game({
        id: "g1",
        official_score_a: 1,
        official_score_b: 0,
      }),
      game({
        id: "g2",
        official_score_a: 2,
        official_score_b: 1,
      }),
    ];
    const predictions: Prediction[] = [
      {
        player_id: "u1",
        game_id: "g1",
        predicted_score_a: 1,
        predicted_score_b: 0,
      },
      {
        player_id: "u1",
        game_id: "g2",
        predicted_score_a: 2,
        predicted_score_b: 1,
      },
    ];
    const result = projectMyStatus("u1", players, games, predictions);
    expect(result.completion).toBe(100);
    expect(result.exacts).toBe(2);
    expect(result.total).toBe(30);
    expect(result.position).toBe(1);
  });

  it("returns nulled fields when user not in players", () => {
    const result = projectMyStatus("ghost", [], [], []);
    expect(result.position).toBeNull();
    expect(result.total).toBe(0);
    expect(result.exacts).toBe(0);
    expect(result.completion).toBe(0);
  });
});

describe("projectGroupLeaders", () => {
  it("returns one entry per group with the leader", () => {
    const games: Game[] = [
      game({
        id: "ga1",
        group_name: "A",
        team_a: "T1",
        team_b: "T2",
        official_score_a: 3,
        official_score_b: 0,
      }),
      game({
        id: "gb1",
        group_name: "B",
        team_a: "T3",
        team_b: "T4",
        official_score_a: 1,
        official_score_b: 2,
      }),
    ];
    const result = projectGroupLeaders(games);
    expect(result.groups.map((g) => g.group)).toEqual(["A", "B"]);
    expect(result.groups[0].leader?.team).toBe("T1");
    expect(result.groups[1].leader?.team).toBe("T4");
  });
});
