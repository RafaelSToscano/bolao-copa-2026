import { describe, it, expect } from "vitest";
import { selectHero } from "../heroSelection";
import { Game } from "@/types/game";
import { LiveSignals } from "@/lib/liveSignals";

const NOW = new Date("2026-06-20T18:00:00.000Z").getTime();

function game(overrides: Partial<Game>): Game {
  return {
    id: overrides.id ?? "g",
    phase: "groups",
    group_name: "A",
    match_order: 1,
    match_date: "2026-06-21T18:00:00.000Z",
    team_a: "Team A",
    team_b: "Team B",
    official_score_a: null,
    official_score_b: null,
    locked: false,
    ...overrides,
  };
}

const NO_LIVE_SIGNALS: LiveSignals = {
  liveGames: [],
  unmatchedLiveScores: [],
  secondsUntilNextKickoff: null,
};

describe("selectHero", () => {
  describe("with-live mode", () => {
    it("returns kind:'live' when liveSignals has live games", () => {
      const result = selectHero(
        [],
        { ...NO_LIVE_SIGNALS, liveGames: [game({ id: "live" })] },
        { mode: "with-live", upcomingFallbackLimit: 2, refNow: NOW }
      );
      expect(result.kind).toBe("live");
    });

    it("returns kind:'live' when liveSignals has unmatched upstream rows", () => {
      const result = selectHero(
        [],
        {
          ...NO_LIVE_SIGNALS,
          unmatchedLiveScores: [
            {
              id: 1,
              utcDate: "2026-06-20T18:00:00.000Z",
              status: "IN_PLAY",
              homeTeam: "X",
              awayTeam: "Y",
              homeScore: 0,
              awayScore: 0,
            },
          ],
        },
        { mode: "with-live", upcomingFallbackLimit: 2, refNow: NOW }
      );
      expect(result.kind).toBe("live");
    });

    it("returns finished+upcoming when nothing live and a finished game is in grace", () => {
      const games = [
        game({
          id: "finished",
          match_date: "2026-06-20T15:00:00.000Z",
          official_score_a: 1,
          official_score_b: 0,
        }),
        game({
          id: "upcoming",
          match_date: "2026-06-21T18:00:00.000Z",
        }),
      ];
      const result = selectHero(games, NO_LIVE_SIGNALS, {
        mode: "with-live",
        upcomingFallbackLimit: 2,
        refNow: NOW,
      });
      expect(result.kind).toBe("finished+upcoming");
      if (result.kind !== "finished+upcoming") return;
      expect(result.finished.id).toBe("finished");
      expect(result.upcoming?.id).toBe("upcoming");
    });

    it("falls back to upcoming-only when no finished is in grace", () => {
      const games = [
        game({ id: "u1", match_date: "2026-06-21T18:00:00.000Z" }),
        game({ id: "u2", match_date: "2026-06-21T21:00:00.000Z" }),
        game({ id: "u3", match_date: "2026-06-22T18:00:00.000Z" }),
      ];
      const result = selectHero(games, NO_LIVE_SIGNALS, {
        mode: "with-live",
        upcomingFallbackLimit: 2,
        refNow: NOW,
      });
      expect(result.kind).toBe("upcoming-only");
      if (result.kind !== "upcoming-only") return;
      expect(result.games.map((g) => g.id)).toEqual(["u1", "u2"]);
    });
  });

  describe("no-live mode", () => {
    it("ignores live signals and still returns finished+upcoming", () => {
      const games = [
        game({
          id: "finished",
          match_date: "2026-06-20T15:00:00.000Z",
          official_score_a: 2,
          official_score_b: 1,
        }),
        game({ id: "upcoming", match_date: "2026-06-21T18:00:00.000Z" }),
      ];
      const result = selectHero(
        games,
        { ...NO_LIVE_SIGNALS, liveGames: [game({ id: "live" })] },
        { mode: "no-live", upcomingFallbackLimit: 2, refNow: NOW }
      );
      expect(result.kind).toBe("finished+upcoming");
    });

    it("falls back to upcoming-only when no finished is in grace", () => {
      const games = [
        game({ id: "u1", match_date: "2026-06-21T18:00:00.000Z" }),
        game({ id: "u2", match_date: "2026-06-21T21:00:00.000Z" }),
      ];
      const result = selectHero(games, NO_LIVE_SIGNALS, {
        mode: "no-live",
        upcomingFallbackLimit: 2,
        refNow: NOW,
      });
      expect(result.kind).toBe("upcoming-only");
    });
  });
});
