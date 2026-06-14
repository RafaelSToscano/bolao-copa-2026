import { Game } from "@/types/game";
import { LiveScoreMatch } from "@/hooks/useLiveScores";
import {
  ESTIMATED_MATCH_DURATION_MS,
  RECENT_FINISHED_GRACE_MS,
} from "@/lib/liveSignals";

const LIVE_WINDOW_MINUTES = 180;

/**
 * Returns the most-recently finished game from the local games list,
 * or null if no game with an official score sits inside the
 * `kickoff + match-duration + grace` window. Used by the dashboard
 * when there are no live games — first paint already has the right
 * card without waiting for /api/live-scores to come back.
 *
 * "Finished" is decided locally: both `official_score_*` columns are
 * set. Kickoff is the only stable timestamp we have (no final-whistle
 * timestamp upstream), so the grace cutoff is measured from
 * `kickoff + ESTIMATED_MATCH_DURATION_MS` to keep a card on screen
 * for ~`RECENT_FINISHED_GRACE_MS` past the realistic end-of-match.
 */
export function getMostRecentFinishedGame(
  games: Game[],
  refNow?: number
): Game | null {
  const now = refNow ?? Date.now();
  const cutoff = now - (ESTIMATED_MATCH_DURATION_MS + RECENT_FINISHED_GRACE_MS);

  let best: Game | null = null;
  let bestKickoff = -Infinity;
  for (const g of games) {
    if (g.official_score_a == null || g.official_score_b == null) continue;
    if (!g.match_date) continue;
    const kickoff = new Date(g.match_date).getTime();
    if (Number.isNaN(kickoff)) continue;
    if (kickoff < cutoff) continue;
    if (kickoff > bestKickoff) {
      best = g;
      bestKickoff = kickoff;
    }
  }
  return best;
}

/**
 * Resolve the score to display for a live-window game. Prefer the
 * football-data feed, fall back to the admin-recorded official score
 * once the API stops returning the finished match. Returns nulls when
 * neither source has a score yet.
 */
export function resolveLiveScore(
  game: Game,
  liveScore: LiveScoreMatch | null
): { home: number | null; away: number | null } {
  const liveAvailable =
    liveScore?.homeScore != null && liveScore?.awayScore != null;
  if (liveAvailable) {
    return { home: liveScore!.homeScore, away: liveScore!.awayScore };
  }
  const officialAvailable =
    game.official_score_a != null && game.official_score_b != null;
  if (officialAvailable) {
    return { home: game.official_score_a, away: game.official_score_b };
  }
  return { home: null, away: null };
}

/**
 * Render the elapsed-minute label shown in the live cards. Uses the
 * football-data status when available (so we say "Fim de jogo" the
 * moment the upstream marks the match FINISHED) and falls back to the
 * elapsed-time heuristic, so finished matches are still labeled
 * correctly during the ~3h live window even after the API drops them.
 */
export function describeLiveMinute(
  game: Game,
  liveScore: LiveScoreMatch | null
): string | null {
  if (liveScore?.status === "FINISHED") return "Fim de jogo";
  if (!game.match_date) return null;
  const elapsed = getElapsedMinutes(game.match_date);
  if (elapsed <= 45) return `${elapsed}'`;
  if (elapsed <= 60) return "Intervalo";
  if (elapsed <= 105) return `${elapsed - 15}'`;
  return "Fim de jogo";
}

export function getLiveGames(games: Game[]): Game[] {
  const now = Date.now();
  return games.filter((game) => {
    if (!game.match_date) return false;
    const kickoff = new Date(game.match_date).getTime();
    const elapsed = (now - kickoff) / 60000;
      return elapsed >= 0 && elapsed <= LIVE_WINDOW_MINUTES;
  });
}

export function getElapsedMinutes(matchDate: string): number {
  return Math.floor((Date.now() - new Date(matchDate).getTime()) / 60000);
}
export function getNextGames(games: Game[], limit = 2): Game[] {
  const now = Date.now();

  return [...games]
    .filter((game) => {
      if (!game.match_date) return false;
      return new Date(game.match_date).getTime() > now;
    })
    .sort((a, b) => {
      const dateA = a.match_date
        ? new Date(a.match_date).getTime()
        : Number.MAX_SAFE_INTEGER;

      const dateB = b.match_date
        ? new Date(b.match_date).getTime()
        : Number.MAX_SAFE_INTEGER;

      return dateA - dateB;
    })
    .slice(0, limit);
}

/**
 * Returns the games belonging to the soonest UTC calendar date that
 * still has at least one not-yet-finished fixture. The list is sorted
 * by kickoff and capped at `limit` (omit / pass `Infinity` to return
 * every game on that day).
 *
 * "Next match day" answers a different question than a flat list of
 * future games: viewers want to know which day to tune in for and how
 * many matches that day. If today still has unfinished kickoffs, today
 * IS the next match day; otherwise it's d+N where N is the gap to the
 * next fixture.
 *
 * "Not finished" is decided locally — both `official_score_*` columns
 * null. We deliberately do NOT require kickoff in the future: when
 * football-data lags (status still TIMED a few minutes after the
 * kickoff time), the game would otherwise jump from "next" to nowhere
 * until either upstream flips IN_PLAY or the admin records a final
 * score.
 */
export function getNextMatchDayGames(
  games: Game[],
  limit: number = Infinity
): Game[] {
  const candidates = games
    .filter((g) => {
      if (!g.match_date) return false;
      if (g.official_score_a !== null && g.official_score_b !== null) return false;
      return true;
    })
    .sort(
      (a, b) =>
        new Date(a.match_date!).getTime() - new Date(b.match_date!).getTime()
    );

  if (candidates.length === 0) return [];

  const dayKey = candidates[0].match_date!.slice(0, 10);
  const sameDay = candidates.filter(
    (g) => g.match_date!.slice(0, 10) === dayKey
  );

  return Number.isFinite(limit) ? sameDay.slice(0, limit) : sameDay;
}