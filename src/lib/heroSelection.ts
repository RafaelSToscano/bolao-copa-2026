import { Game } from "@/types/game";
import { LiveSignals } from "@/lib/liveSignals";
import {
  getMostRecentFinishedGame,
  getNextMatchDayGames,
} from "@/lib/liveGames";

export type HeroSelection =
  | { kind: "live" }
  | { kind: "finished+upcoming"; finished: Game; upcoming: Game | null }
  | { kind: "upcoming-only"; games: Game[] };

export interface SelectHeroOptions {
  /**
   * `with-live` — when liveSignals has live games or unmatched live
   *   rows, return `kind: "live"` so the caller can render its live UI.
   * `no-live` — ignore live state entirely; only finished+upcoming and
   *   upcoming-only branches are returned. Used by /palpites where the
   *   top section is intentionally not a live surface.
   */
  mode: "with-live" | "no-live";
  /** Cap for the upcoming-only fallback (no finished card available). */
  upcomingFallbackLimit: number;
  refNow?: number;
}

/**
 * Picks what the top-of-screen hero section should show, shared
 * between the dashboard and /palpites so both screens stay in sync.
 *
 *  - `live` (with-live mode only): something's running upstream
 *  - `finished+upcoming`: the most recent finished game (within the
 *    grace window) paired with the next match-day's first game
 *  - `upcoming-only`: nothing finished within grace — fall back to the
 *    next match-day capped at `upcomingFallbackLimit`
 */
export function selectHero(
  games: Game[],
  liveSignals: LiveSignals,
  options: SelectHeroOptions
): HeroSelection {
  const { mode, upcomingFallbackLimit, refNow } = options;

  if (mode === "with-live") {
    const liveOnlyVisible =
      liveSignals.liveGames.length > 0 ||
      liveSignals.unmatchedLiveScores.length > 0;
    if (liveOnlyVisible) return { kind: "live" };
  }

  const finished = getMostRecentFinishedGame(games, refNow);
  if (finished) {
    const upcoming = getNextMatchDayGames(games, 1)[0] ?? null;
    return { kind: "finished+upcoming", finished, upcoming };
  }

  return {
    kind: "upcoming-only",
    games: getNextMatchDayGames(games, upcomingFallbackLimit),
  };
}
