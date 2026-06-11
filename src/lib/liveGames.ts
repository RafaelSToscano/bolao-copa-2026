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
