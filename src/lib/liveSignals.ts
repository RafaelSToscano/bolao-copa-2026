import { Game } from "@/types/game";
import {
  LiveScoreMatch,
  findLiveScoreForGame,
  isLiveStatus,
  isUpcomingStatus,
} from "@/hooks/useLiveScores";

export interface LiveSignals {
  liveGames: Game[];
  secondsUntilNextKickoff: number | null;
}

/**
 * Derives the dashboard's live signals — which `Game[]` are live right
 * now and how long until the next kickoff — from the football-data
 * feed and the local games list. Replaces the deleted
 * `/api/dashboard/live` route.
 *
 * `liveGames` is strictly upstream-driven: a `Game` is included only
 * when its football-data row's status is IN_PLAY/PAUSED/LIVE/HALF_TIME.
 * Finished matches drop off immediately (no DB-side 180-min window),
 * matching how the rest of the app already treats the upstream as
 * source of truth.
 *
 * `secondsUntilNextKickoff` walks TIMED/SCHEDULED rows in the upstream
 * feed (so it tracks today's matches the API knows about, not every
 * future fixture in the DB) and returns the smallest positive
 * `utcDate - now`. Null when nothing's pending today.
 */
export function deriveLiveSignals(
  games: Game[],
  liveScores: LiveScoreMatch[],
  refNow?: number
): LiveSignals {
  const now = refNow ?? Date.now();

  const liveGames = games.filter((g) => {
    const ls = findLiveScoreForGame(g, liveScores);
    return ls != null && isLiveStatus(ls.status);
  });

  let secondsUntilNextKickoff: number | null = null;
  for (const m of liveScores) {
    if (!isUpcomingStatus(m.status)) continue;
    const kickoff = new Date(m.utcDate).getTime();
    const diffSec = Math.floor((kickoff - now) / 1000);
    if (diffSec < 0) continue;
    if (
      secondsUntilNextKickoff === null ||
      diffSec < secondsUntilNextKickoff
    ) {
      secondsUntilNextKickoff = diffSec;
    }
  }

  return { liveGames, secondsUntilNextKickoff };
}
