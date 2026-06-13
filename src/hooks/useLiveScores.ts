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

// Live window: poll from 60 min before kickoff to 180 min after. The
// pre-kickoff slice warms the feed so the live frame lands the moment
// upstream flips status; the post-kickoff slice covers regulation +
// extra time + upstream-FT lag without burning requests all day.
export const LIVE_WINDOW_PRE_MS = 60 * 60 * 1000;
export const LIVE_WINDOW_POST_MS = 180 * 60 * 1000;

const LIVE_STATUSES = new Set(["IN_PLAY", "PAUSED", "LIVE", "HALF_TIME"]);
const UPCOMING_STATUSES = new Set(["TIMED", "SCHEDULED"]);

export function isLiveStatus(status: string): boolean {
  return LIVE_STATUSES.has(status);
}

export function isUpcomingStatus(status: string): boolean {
  return UPCOMING_STATUSES.has(status);
}

/**
 * Single client-side reader for football-data scores. Polls
 * `/api/live-scores` (which serves the already-normalized
 * `LiveScoreMatch[]` shape) every 10s while at least one project game
 * is in its live window (kickoff −60 min to kickoff +180 min). Goes
 * silent (no polling, empty array) outside that window so we don't
 * burn requests off-matchday.
 *
 * Mounted by `DashboardSection`; the matches it returns drive the
 * live cards, the goal-detection effect, AND the dashboard's
 * fast-poll signal (live games + secondsUntilNextKickoff). Live UI
 * lives only on the dashboard now — /palpites is prediction-only.
 */
export function useLiveScores(games: Game[]) {
  const [matches, setMatches] = useState<LiveScoreMatch[]>([]);
  const shouldPoll = hasLiveOrImminent(games);

  useEffect(() => {
    if (!shouldPoll) {
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
  }, [shouldPoll]);

  return matches;
}

function hasLiveOrImminent(games: Game[]): boolean {
  const now = Date.now();
  for (const g of games) {
    if (!g.match_date) continue;
    const kickoff = new Date(g.match_date).getTime();
    const elapsed = now - kickoff;
    if (elapsed < 0 && -elapsed <= LIVE_WINDOW_PRE_MS) return true;
    if (elapsed >= 0 && elapsed <= LIVE_WINDOW_POST_MS) return true;
  }
  return false;
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
