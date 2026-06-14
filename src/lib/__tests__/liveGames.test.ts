import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  describeLiveMinute,
  getMostRecentFinishedGame,
  getNextMatchDayGames,
  resolveLiveScore,
} from "@/lib/liveGames";
import {
  ESTIMATED_MATCH_DURATION_MS,
  RECENT_FINISHED_GRACE_MS,
} from "@/lib/liveSignals";
import { Game } from "@/types/game";
import { LiveScoreMatch } from "@/hooks/useLiveScores";

const MATCH_DATE = "2026-06-20T18:00:00.000Z";

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: "g1",
    phase: "groups",
    group_name: "A",
    match_order: 1,
    match_date: MATCH_DATE,
    team_a: "Brasil",
    team_b: "Argentina",
    official_score_a: null,
    official_score_b: null,
    locked: false,
    ...overrides,
  };
}

function makeLiveScore(overrides: Partial<LiveScoreMatch> = {}): LiveScoreMatch {
  return {
    id: 1,
    utcDate: MATCH_DATE,
    status: "IN_PLAY",
    homeTeam: "Brasil",
    awayTeam: "Argentina",
    homeScore: 0,
    awayScore: 0,
    ...overrides,
  };
}

describe("resolveLiveScore", () => {
  it("returns the live API score when present", () => {
    const r = resolveLiveScore(
      makeGame({ official_score_a: 9, official_score_b: 9 }),
      makeLiveScore({ homeScore: 2, awayScore: 1 })
    );
    expect(r).toEqual({ home: 2, away: 1 });
  });

  it("falls back to official score when live score is missing", () => {
    const r = resolveLiveScore(
      makeGame({ official_score_a: 3, official_score_b: 0 }),
      null
    );
    expect(r).toEqual({ home: 3, away: 0 });
  });

  it("falls back to official score when live score is partially null", () => {
    const r = resolveLiveScore(
      makeGame({ official_score_a: 1, official_score_b: 2 }),
      makeLiveScore({ homeScore: null, awayScore: 1 })
    );
    expect(r).toEqual({ home: 1, away: 2 });
  });

  it("returns nulls when neither source has a score", () => {
    const r = resolveLiveScore(makeGame(), null);
    expect(r).toEqual({ home: null, away: null });
  });
});

describe("describeLiveMinute", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses 'Fim de jogo' when the live API marks the match FINISHED", () => {
    vi.setSystemTime(new Date("2026-06-20T18:30:00.000Z")); // 30' in
    const label = describeLiveMinute(
      makeGame(),
      makeLiveScore({ status: "FINISHED" })
    );
    expect(label).toBe("Fim de jogo");
  });

  it("renders elapsed minutes during the first half", () => {
    vi.setSystemTime(new Date("2026-06-20T18:30:00.000Z"));
    expect(describeLiveMinute(makeGame(), null)).toBe("30'");
  });

  it("renders 'Intervalo' between 46-60 elapsed minutes", () => {
    vi.setSystemTime(new Date("2026-06-20T18:50:00.000Z"));
    expect(describeLiveMinute(makeGame(), null)).toBe("Intervalo");
  });

  it("subtracts 15min during the second half", () => {
    vi.setSystemTime(new Date("2026-06-20T19:30:00.000Z")); // 90' in
    expect(describeLiveMinute(makeGame(), null)).toBe("75'");
  });

  it("falls back to 'Fim de jogo' once elapsed > 105min and the API has no status", () => {
    vi.setSystemTime(new Date("2026-06-20T20:00:00.000Z")); // 120' in
    expect(describeLiveMinute(makeGame(), null)).toBe("Fim de jogo");
  });

  it("returns null when the game has no kickoff date", () => {
    expect(describeLiveMinute(makeGame({ match_date: null }), null)).toBeNull();
  });
});

describe("getNextMatchDayGames", () => {
  const NOW = new Date("2026-06-20T12:00:00.000Z").getTime();

  it("returns every game on the next match day when no limit is given", () => {
    const games = [
      makeGame({ id: "a", match_date: "2026-06-20T13:00:00.000Z" }),
      makeGame({ id: "b", match_date: "2026-06-20T16:00:00.000Z" }),
      makeGame({ id: "c", match_date: "2026-06-20T20:00:00.000Z" }),
      makeGame({ id: "d", match_date: "2026-06-21T13:00:00.000Z" }),
    ];
    expect(
      getNextMatchDayGames(games, Infinity, NOW).map((g) => g.id)
    ).toEqual(["a", "b", "c"]);
  });

  it("respects the limit when provided", () => {
    const games = [
      makeGame({ id: "a", match_date: "2026-06-20T13:00:00.000Z" }),
      makeGame({ id: "b", match_date: "2026-06-20T16:00:00.000Z" }),
      makeGame({ id: "c", match_date: "2026-06-20T20:00:00.000Z" }),
    ];
    expect(getNextMatchDayGames(games, 2, NOW).map((g) => g.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("skips today entirely when all today's matches are finished or past", () => {
    const games = [
      makeGame({
        id: "today-finished",
        match_date: "2026-06-20T14:00:00.000Z",
        official_score_a: 1,
        official_score_b: 0,
      }),
      makeGame({
        id: "today-past",
        match_date: "2026-06-20T11:00:00.000Z",
      }),
      makeGame({ id: "tomorrow", match_date: "2026-06-21T16:00:00.000Z" }),
    ];
    expect(
      getNextMatchDayGames(games, Infinity, NOW).map((g) => g.id)
    ).toEqual(["tomorrow"]);
  });

  it("jumps over an empty d+1 to d+2 when d+0 is exhausted", () => {
    const games = [
      makeGame({
        id: "today-past",
        match_date: "2026-06-20T11:00:00.000Z",
      }),
      makeGame({ id: "d2-1", match_date: "2026-06-22T13:00:00.000Z" }),
      makeGame({ id: "d2-2", match_date: "2026-06-22T19:00:00.000Z" }),
      makeGame({ id: "d3", match_date: "2026-06-23T13:00:00.000Z" }),
    ];
    expect(
      getNextMatchDayGames(games, Infinity, NOW).map((g) => g.id)
    ).toEqual(["d2-1", "d2-2"]);
  });

  it("returns [] when nothing is upcoming", () => {
    const games = [
      makeGame({ id: "past", match_date: "2026-06-20T11:00:00.000Z" }),
    ];
    expect(getNextMatchDayGames(games, Infinity, NOW)).toEqual([]);
  });
});

describe("getMostRecentFinishedGame", () => {
  const NOW = new Date("2026-06-20T20:34:00.000Z").getTime();

  it("returns the latest-kickoff game with both official scores", () => {
    const games = [
      makeGame({
        id: "early",
        match_date: new Date(NOW - 5 * 60 * 60 * 1000).toISOString(),
        official_score_a: 1,
        official_score_b: 0,
      }),
      makeGame({
        id: "late",
        match_date: new Date(NOW - 3 * 60 * 60 * 1000).toISOString(),
        official_score_a: 7,
        official_score_b: 1,
      }),
    ];
    expect(getMostRecentFinishedGame(games, NOW)?.id).toBe("late");
  });

  it("ignores games without official scores", () => {
    const games = [
      makeGame({
        id: "no-score",
        match_date: new Date(NOW - 30 * 60 * 1000).toISOString(),
        official_score_a: null,
        official_score_b: null,
      }),
    ];
    expect(getMostRecentFinishedGame(games, NOW)).toBeNull();
  });

  it("drops games whose estimated end is older than the grace window", () => {
    const games = [
      makeGame({
        id: "stale",
        match_date: new Date(
          NOW - (ESTIMATED_MATCH_DURATION_MS + RECENT_FINISHED_GRACE_MS + 60_000)
        ).toISOString(),
        official_score_a: 1,
        official_score_b: 0,
      }),
    ];
    expect(getMostRecentFinishedGame(games, NOW)).toBeNull();
  });

  it("keeps a finished game whose estimated end is within the grace window", () => {
    // 3.5h-old kickoff → estimated end 1.5h ago → inside the 1h grace
    // (the grace clock starts at kickoff + 2h, so we have 30min left).
    const games = [
      makeGame({
        id: "fresh",
        match_date: new Date(
          NOW - (ESTIMATED_MATCH_DURATION_MS + 30 * 60 * 1000)
        ).toISOString(),
        official_score_a: 0,
        official_score_b: 0,
      }),
    ];
    expect(getMostRecentFinishedGame(games, NOW)?.id).toBe("fresh");
  });
});
