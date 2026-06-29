import { describe, it, expect } from "vitest";
import {
  pickCurrentKnockoutRound,
  pickNextKnockoutRound,
} from "@/lib/knockoutRounds";
import { KnockoutMatchRecord, KnockoutRound } from "@/types/knockout";

function match(
  id: number,
  round: KnockoutRound,
  winner: string | null
): KnockoutMatchRecord {
  return {
    id,
    round,
    match_number: id,
    home_slot: `H${id}`,
    away_slot: `A${id}`,
    home_team: null,
    away_team: null,
    official_score_home: null,
    official_score_away: null,
    winner_team: winner,
    match_date: null,
    locked: false,
  };
}

describe("pickNextKnockoutRound", () => {
  it("returns r16 while r32 still has pending matches", () => {
    const matches = [
      match(1, "r32", "Brasil"),
      match(2, "r32", null),
      match(3, "r32", null),
    ];
    expect(pickNextKnockoutRound(matches)).toBe("r16");
  });

  it("returns qf once every r32 has a winner and r16 still has pending", () => {
    const matches = [
      match(1, "r32", "Brasil"),
      match(2, "r32", "Argentina"),
      match(3, "r16", null),
    ];
    expect(pickNextKnockoutRound(matches)).toBe("qf");
  });

  it("stays on Final when the Final is still pending", () => {
    const matches = [
      match(1, "r32", "A"),
      match(2, "r16", "A"),
      match(3, "qf", "A"),
      match(4, "sf", "A"),
      match(5, "final", null),
    ];
    expect(pickNextKnockoutRound(matches)).toBe("final");
  });

  it("returns null with no matches", () => {
    expect(pickNextKnockoutRound([])).toBeNull();
  });

  it("ignores third_place when walking the progression", () => {
    const matches = [
      match(1, "sf", "A"),
      match(2, "third_place", null),
      match(3, "final", null),
    ];
    expect(pickNextKnockoutRound(matches)).toBe("final");
  });
});

describe("pickCurrentKnockoutRound", () => {
  it("returns r32 while at least one r32 match is pending", () => {
    const matches = [
      match(1, "r32", "Brasil"),
      match(2, "r32", null),
    ];
    expect(pickCurrentKnockoutRound(matches)).toBe("r32");
  });

  it("returns r16 once every r32 is decided and r16 still has pending", () => {
    const matches = [
      match(1, "r32", "A"),
      match(2, "r32", "B"),
      match(3, "r16", null),
    ];
    expect(pickCurrentKnockoutRound(matches)).toBe("r16");
  });

  it("returns null when every round is decided", () => {
    const matches = [match(1, "r32", "A"), match(2, "final", "A")];
    expect(pickCurrentKnockoutRound(matches)).toBeNull();
  });
});
