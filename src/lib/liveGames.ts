import { Game } from "@/types/game";

const LIVE_WINDOW_MINUTES = 180;

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