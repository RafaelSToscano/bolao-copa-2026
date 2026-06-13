import { useEffect, useState } from "react";
import { Game } from "@/types/game";

export type LiveScoreMatch = {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
};

export const LIVE_POLL_MS = 10_000;

/**
 * Single client-side reader for live football-data scores. Polls
 * `/api/live-scores` (which serves the already-normalized
 * `LiveScoreMatch[]` shape) at 10s while at least one game is in the
 * live window. Goes silent (no polling, empty array) when no games
 * are live, so we don't burn requests off-matchday. Mounted by
 * `DashboardSection` and `LiveGameBanner`, which then pass `matches`
 * to `findLiveScoreForGame` per card.
 */
export function useLiveScores(activeGames: Game[]) {
  const [matches, setMatches] = useState<LiveScoreMatch[]>([]);
  const hasLive = activeGames.length > 0;

  useEffect(() => {
    if (!hasLive) {
      setMatches([]);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/live-scores");
        if (!res.ok) return;
        const data = (await res.json()) as { matches?: LiveScoreMatch[] };
        if (cancelled) return;
        setMatches(data.matches ?? []);
      } catch {
        if (!cancelled) setMatches([]);
      }
    }

    load();
    const id = setInterval(load, LIVE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [hasLive]);

  return matches;
}

export function findLiveScoreForGame(
  game: Game,
  matches: LiveScoreMatch[]
): LiveScoreMatch | null {
  if (!game.match_date) return null;

  const gameTime = new Date(game.match_date).getTime();

  // Match by team-pair AND time proximity. Time alone is not enough
  // when two live games kick off within 90 minutes of each other —
  // we'd return the first match in that window for every lookup,
  // showing the same score on different cards.
  const teamPairMatches = (match: LiveScoreMatch) =>
    (match.homeTeam === game.team_a && match.awayTeam === game.team_b) ||
    (match.homeTeam === game.team_b && match.awayTeam === game.team_a);

  return (
    matches.find((match) => {
      if (!teamPairMatches(match)) return false;
      const apiTime = new Date(match.utcDate).getTime();
      const diffMinutes = Math.abs(apiTime - gameTime) / 60000;
      return diffMinutes <= 90;
    }) || null
  );
}
