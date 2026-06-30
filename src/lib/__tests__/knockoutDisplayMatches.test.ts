import { describe, it, expect } from "vitest";
import {
  applyLiveScoresToKnockoutMatches,
  DisplayKnockoutMatch,
} from "@/lib/knockoutDisplayMatches";
import { LiveScoreMatch } from "@/hooks/useLiveScores";

function buildMatch(
  overrides: Partial<DisplayKnockoutMatch> = {}
): DisplayKnockoutMatch {
  return {
    id: 1,
    round: "r32",
    match_number: 1,
    home_slot: "1A",
    away_slot: "2B",
    home_team: null,
    away_team: null,
    official_score_home: null,
    official_score_away: null,
    winner_team: null,
    match_date: "2026-07-04T20:00:00.000Z",
    locked: false,
    display_home_team: null,
    display_away_team: null,
    ...overrides,
  };
}

function buildLive(
  overrides: Partial<LiveScoreMatch> = {}
): LiveScoreMatch {
  return {
    id: 999,
    utcDate: "2026-07-04T20:00:00.000Z",
    status: "IN_PLAY",
    homeTeam: "Brasil",
    awayTeam: "Argentina",
    homeScore: 0,
    awayScore: 0,
    ...overrides,
  };
}

describe("applyLiveScoresToKnockoutMatches", () => {
  it("returns input unchanged when no live scores are passed", () => {
    const matches = [
      buildMatch({
        display_home_team: "Brasil",
        display_away_team: "Argentina",
      }),
    ];
    expect(applyLiveScoresToKnockoutMatches(matches, [])).toEqual(matches);
  });

  it("does not cascade when the live match is tied", () => {
    const matches = [
      buildMatch({
        id: 1,
        round: "r32",
        match_number: 1,
        display_home_team: "Brasil",
        display_away_team: "Argentina",
      }),
      buildMatch({
        id: 10,
        round: "r16",
        match_number: 1,
        home_slot: "W1",
        away_slot: "W2",
        home_team: null,
        away_team: null,
        display_home_team: null,
        display_away_team: null,
      }),
    ];

    const result = applyLiveScoresToKnockoutMatches(matches, [
      buildLive({ homeScore: 1, awayScore: 1 }),
    ]);

    const r16 = result.find((m) => m.id === 10)!;
    expect(r16.display_home_team).toBeNull();
    expect(r16.display_away_team).toBeNull();
    expect(r16.tentative_teams).toBeUndefined();
    expect(r16.live).toBeUndefined();
  });

  it("cascades the provisional winner into the downstream W{id} slot", () => {
    const matches = [
      buildMatch({
        id: 1,
        round: "r32",
        match_number: 1,
        display_home_team: "Brasil",
        display_away_team: "Argentina",
      }),
      buildMatch({
        id: 10,
        round: "r16",
        match_number: 1,
        home_slot: "W1",
        away_slot: "W2",
        home_team: null,
        away_team: null,
        display_home_team: null,
        display_away_team: null,
      }),
    ];

    const result = applyLiveScoresToKnockoutMatches(matches, [
      buildLive({ homeScore: 2, awayScore: 1 }),
    ]);

    const r32 = result.find((m) => m.id === 1)!;
    expect(r32.live).toBe(true);
    expect(r32.tentative_teams).toBeUndefined();
    expect(r32.winner_team).toBe("Brasil");
    expect(r32.official_score_home).toBe(2);

    const r16 = result.find((m) => m.id === 10)!;
    expect(r16.display_home_team).toBe("Brasil");
    expect(r16.tentative_teams).toBe(true);
    expect(r16.live).toBeUndefined();
  });

  it("cascades the provisional loser into a downstream L{id} slot", () => {
    const matches = [
      buildMatch({
        id: 1,
        round: "r32",
        match_number: 1,
        display_home_team: "Brasil",
        display_away_team: "Argentina",
      }),
      buildMatch({
        id: 20,
        round: "r16",
        match_number: 1,
        home_slot: "L1",
        away_slot: "W99",
        home_team: null,
        away_team: null,
        display_home_team: null,
        display_away_team: null,
      }),
    ];

    const result = applyLiveScoresToKnockoutMatches(matches, [
      buildLive({ homeScore: 2, awayScore: 1 }),
    ]);

    const downstream = result.find((m) => m.id === 20)!;
    expect(downstream.display_home_team).toBe("Argentina");
    expect(downstream.tentative_teams).toBe(true);
    expect(downstream.live).toBeUndefined();
  });

  it("ignores matches whose status is not LIVE", () => {
    const matches = [
      buildMatch({
        id: 1,
        round: "r32",
        match_number: 1,
        display_home_team: "Brasil",
        display_away_team: "Argentina",
      }),
    ];

    const result = applyLiveScoresToKnockoutMatches(matches, [
      buildLive({ status: "TIMED", homeScore: 2, awayScore: 1 }),
    ]);

    expect(result[0].winner_team).toBeNull();
    expect(result[0].live).toBeUndefined();
  });

  it("does not overwrite an official winner that's already in the DB", () => {
    const matches = [
      buildMatch({
        id: 1,
        round: "r32",
        match_number: 1,
        display_home_team: "Brasil",
        display_away_team: "Argentina",
        winner_team: "Argentina",
        official_score_home: 1,
        official_score_away: 2,
      }),
    ];

    const result = applyLiveScoresToKnockoutMatches(matches, [
      buildLive({ homeScore: 3, awayScore: 1 }),
    ]);

    expect(result[0].winner_team).toBe("Argentina");
    expect(result[0].official_score_home).toBe(1);
    expect(result[0].live).toBeUndefined();
  });

  it("does not overwrite a DB-cascaded downstream team", () => {
    const matches = [
      buildMatch({
        id: 1,
        round: "r32",
        match_number: 1,
        display_home_team: "Brasil",
        display_away_team: "Argentina",
      }),
      buildMatch({
        id: 10,
        round: "r16",
        match_number: 1,
        home_slot: "W1",
        away_slot: "W2",
        home_team: "Some Confirmed Team",
        away_team: null,
        display_home_team: "Some Confirmed Team",
        display_away_team: null,
      }),
    ];

    const result = applyLiveScoresToKnockoutMatches(matches, [
      buildLive({ homeScore: 2, awayScore: 1 }),
    ]);

    const r16 = result.find((m) => m.id === 10)!;
    expect(r16.display_home_team).toBe("Some Confirmed Team");
  });
});
