import { Game } from "@/types/game";
import { LiveScoreMatch } from "@/hooks/useLiveScores";

const LIVE_WINDOW_MINUTES = 180;

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