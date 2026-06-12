import { Game } from "@/types/game";
import { MOCK_GAMES } from "./mockGames";
import { MOCK_NOW } from "./mockNow";
import { LiveScoreMatch } from "@/hooks/useLiveScores";

const LIVE_WINDOW_MINUTES = 180;

function isLiveAt(game: Game, atMs: number): boolean {
  if (!game.match_date) return false;
  const kickoff = new Date(game.match_date).getTime();
  const elapsed = (atMs - kickoff) / 60000;
  return elapsed >= 0 && elapsed <= LIVE_WINDOW_MINUTES;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function baseLiveScoreFor(game: Game, atMs: number): { home: number; away: number } {
  const kickoff = new Date(game.match_date!).getTime();
  const elapsed = Math.max(0, (atMs - kickoff) / 60000);
  const minutesPlayed = Math.min(90, elapsed);

  const seedBase = game.id
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const home = Math.floor(pseudoRandom(seedBase) * (minutesPlayed / 30));
  const away = Math.floor(pseudoRandom(seedBase + 1) * (minutesPlayed / 30));
  return { home, away };
}

/**
 * Per-process mutable score deltas for mock-mode goal simulation. Only
 * touched via the `/api/dashboard/mock-goal` route, which is itself
 * gated on USE_MOCK_DATA.
 *
 * Hung off globalThis so that Next.js dev's per-route module bundling
 * (and HMR re-evaluations) don't give each route a separate Map.
 * Without this the bump route would mutate one Map while the live
 * route reads from another, and goals would silently disappear.
 */
const GOAL_DELTAS_KEY = Symbol.for("bolao.mockGoalDeltas");
type GlobalWithDeltas = typeof globalThis & {
  [k: symbol]: Map<string, { home: number; away: number }> | undefined;
};
const globalScope = globalThis as GlobalWithDeltas;
if (!globalScope[GOAL_DELTAS_KEY]) {
  globalScope[GOAL_DELTAS_KEY] = new Map();
}
const goalDeltas = globalScope[GOAL_DELTAS_KEY] as Map<
  string,
  { home: number; away: number }
>;

export function bumpMockGoal(
  gameId: string,
  side: "home" | "away",
  delta: number
): { home: number; away: number } | null {
  const game = MOCK_GAMES.find((g) => g.id === gameId);
  if (!game) return null;
  if (!isLiveAt(game, MOCK_NOW)) return null;

  const current = goalDeltas.get(gameId) ?? { home: 0, away: 0 };
  const next = {
    home: side === "home" ? Math.max(0, current.home + delta) : current.home,
    away: side === "away" ? Math.max(0, current.away + delta) : current.away,
  };
  goalDeltas.set(gameId, next);

  const base = baseLiveScoreFor(game, MOCK_NOW);
  return {
    home: base.home + next.home,
    away: base.away + next.away,
  };
}

export function resetMockGoals(): void {
  goalDeltas.clear();
}

function liveScoreFor(game: Game, atMs: number): { home: number; away: number } {
  const base = baseLiveScoreFor(game, atMs);
  const delta = goalDeltas.get(game.id);
  if (!delta) return base;
  return { home: base.home + delta.home, away: base.away + delta.away };
}

export function getMockLiveScores(): { matches: unknown[] } {
  const now = MOCK_NOW;
  const matches = MOCK_GAMES.filter((game) => isLiveAt(game, now)).map((game) => {
    const score = liveScoreFor(game, now);
    return {
      id: parseInt(game.id.replace(/\D/g, "").slice(0, 8) || "0", 10),
      utcDate: game.match_date,
      status: "IN_PLAY",
      homeTeam: { name: game.team_a },
      awayTeam: { name: game.team_b },
      score: {
        fullTime: {
          home: score.home,
          away: score.away,
        },
      },
    };
  });
  return { matches };
}

export function getMockLiveScoresNormalized(): LiveScoreMatch[] {
  const now = MOCK_NOW;
  return MOCK_GAMES.filter((game) => isLiveAt(game, now)).map((game) => {
    const score = liveScoreFor(game, now);
    return {
      id: parseInt(game.id.replace(/\D/g, "").slice(0, 8) || "0", 10),
      utcDate: game.match_date!,
      status: "IN_PLAY",
      homeTeam: game.team_a,
      awayTeam: game.team_b,
      homeScore: score.home,
      awayScore: score.away,
    };
  });
}
