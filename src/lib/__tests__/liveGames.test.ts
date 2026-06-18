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

  it("falls back to official score when live score is partially null and status is finished", () => {
    const r = resolveLiveScore(
      makeGame({ official_score_a: 1, official_score_b: 2 }),
      makeLiveScore({ status: "FINISHED", homeScore: null, awayScore: 1 })
    );
    expect(r).toEqual({ home: 1, away: 2 });
  });

  it("treats null upstream scores as 0-0 when the match is IN_PLAY", () => {
    // football-data returns null homeScore/awayScore on a freshly-flipped
    // IN_PLAY row before the first goal is reported. The card must show
    // 0-0 instead of dashes during that window.
    const r = resolveLiveScore(
      makeGame(),
      makeLiveScore({ homeScore: null, awayScore: null })
    );
    expect(r).toEqual({ home: 0, away: 0 });
  });

  it("does not coerce nulls to 0-0 when upstream status is not live", () => {
    const r = resolveLiveScore(
      makeGame(),
      makeLiveScore({ status: "TIMED", homeScore: null, awayScore: null })
    );
    expect(r).toEqual({ home: null, away: null });
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
  it("returns every game on the next match day when no limit is given", () => {
    const games = [
      makeGame({ id: "a", match_date: "2026-06-20T13:00:00.000Z" }),
      makeGame({ id: "b", match_date: "2026-06-20T16:00:00.000Z" }),
      makeGame({ id: "c", match_date: "2026-06-20T20:00:00.000Z" }),
      makeGame({ id: "d", match_date: "2026-06-21T13:00:00.000Z" }),
    ];
    expect(getNextMatchDayGames(games, Infinity).map((g) => g.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("respects the limit when provided", () => {
    const games = [
      makeGame({ id: "a", match_date: "2026-06-20T13:00:00.000Z" }),
      makeGame({ id: "b", match_date: "2026-06-20T16:00:00.000Z" }),
      makeGame({ id: "c", match_date: "2026-06-20T20:00:00.000Z" }),
    ];
    expect(getNextMatchDayGames(games, 2).map((g) => g.id)).toEqual(["a", "b"]);
  });

  it("excludes finished games and surfaces the next day's matches", () => {
    const games = [
      makeGame({
        id: "today-finished",
        match_date: "2026-06-20T14:00:00.000Z",
        official_score_a: 1,
        official_score_b: 0,
      }),
      makeGame({ id: "tomorrow", match_date: "2026-06-21T16:00:00.000Z" }),
    ];
    expect(getNextMatchDayGames(games, Infinity).map((g) => g.id)).toEqual([
      "tomorrow",
    ]);
  });

  it("keeps a no-score game whose kickoff has slipped into the past", () => {
    // Upstream football-data lags behind the real-world kickoff
    // (status still TIMED a few minutes after match time). The game
    // has no official score yet, so it MUST stay surfaced as the
    // next match — otherwise it vanishes from the dashboard until
    // the API catches up.
    const games = [
      makeGame({
        id: "delayed-today",
        match_date: "2026-06-20T11:00:00.000Z",
      }),
      makeGame({ id: "tomorrow", match_date: "2026-06-21T16:00:00.000Z" }),
    ];
    expect(getNextMatchDayGames(games, Infinity).map((g) => g.id)).toEqual([
      "delayed-today",
    ]);
  });

  it("returns [] when every game is finished", () => {
    const games = [
      makeGame({
        id: "done",
        match_date: "2026-06-20T11:00:00.000Z",
        official_score_a: 0,
        official_score_b: 0,
      }),
    ];
    expect(getNextMatchDayGames(games, Infinity)).toEqual([]);
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
