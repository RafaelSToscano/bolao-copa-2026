import { describe, it, expect } from "vitest";
import { getNextVisibleMatches } from "@/lib/nextVisibleMatches";
import { Game } from "@/types/game";
import { KnockoutMatchRecord } from "@/types/knockout";

function buildKnockoutMatch(
  overrides: Partial<KnockoutMatchRecord> = {}
): KnockoutMatchRecord {
  return {
    id: 1,
    round: "qf",
    match_number: 1,
    home_slot: "1A",
    away_slot: "2B",
    home_team: "Brasil",
    away_team: "Argentina",
    official_score_home: null,
    official_score_away: null,
    winner_team: null,
    match_date: "2026-07-10T20:00:00.000Z",
    locked: false,
    ...overrides,
  };
}

function buildGame(overrides: Partial<Game> = {}): Game {
  return {
    id: "g1",
    phase: "groups",
    group_name: "A",
    match_order: 1,
    match_date: "2026-06-11T20:00:00.000Z",
    team_a: "Brasil",
    team_b: "Argentina",
    official_score_a: null,
    official_score_b: null,
    locked: false,
    ...overrides,
  };
}

describe("getNextVisibleMatches", () => {
  it("marks knockout matches as predictionsOpen when the round deadline is in the future", () => {
    // qf deadline is 2026-07-09T19:00Z; sample a moment before that.
    const now = new Date("2026-07-09T18:00:00.000Z");
    const match = buildKnockoutMatch({ round: "qf" });

    const result = getNextVisibleMatches([], [match], 2, now);

    expect(result).toHaveLength(1);
    expect(result[0].predictionsOpen).toBe(true);
  });

  it("marks knockout matches as closed once the round deadline has passed", () => {
    const now = new Date("2026-07-09T20:00:00.000Z");
    const match = buildKnockoutMatch({ round: "qf" });

    const result = getNextVisibleMatches([], [match], 2, now);

    expect(result).toHaveLength(1);
    expect(result[0].predictionsOpen).toBe(false);
  });

  it("marks group games based on GROUPS_PHASE_DEADLINE", () => {
    // GROUPS_PHASE_DEADLINE is 2026-06-10T23:59:59 (local); pick a
    // time well before and well after to exercise both branches.
    const beforeGroups = new Date("2026-06-05T12:00:00.000Z");
    const afterGroups = new Date("2026-07-01T12:00:00.000Z");
    const game = buildGame({ match_date: "2026-06-11T20:00:00.000Z" });

    expect(
      getNextVisibleMatches([game], [], 2, beforeGroups)[0].predictionsOpen
    ).toBe(true);
    expect(
      getNextVisibleMatches([game], [], 2, afterGroups)[0].predictionsOpen
    ).toBe(false);
  });

  it("carries per-match round semantics — an earlier round can be closed while a later one is still open", () => {
    // r16 deadline is 2026-07-04T16:00Z; qf deadline is 2026-07-09T19:00Z.
    // At this moment r16 is closed but qf is still open.
    const now = new Date("2026-07-05T12:00:00.000Z");
    const r16 = buildKnockoutMatch({
      id: 10,
      round: "r16",
      match_date: "2026-07-05T20:00:00.000Z",
    });
    const qf = buildKnockoutMatch({
      id: 11,
      round: "qf",
      match_date: "2026-07-05T20:00:00.000Z",
    });

    const result = getNextVisibleMatches([], [r16, qf], 5, now);

    const byId = Object.fromEntries(result.map((m) => [m.id, m.predictionsOpen]));
    expect(byId["10"]).toBe(false);
    expect(byId["11"]).toBe(true);
  });
});
