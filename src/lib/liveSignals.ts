import { Game } from "@/types/game";
import {
  LiveScoreMatch,
  findLiveScoreForGame,
  isLiveStatus,
  isUpcomingStatus,
} from "@/hooks/useLiveScores";

export interface LiveSignals {
  liveGames: Game[];
  unmatchedLiveScores: LiveScoreMatch[];
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
 * `unmatchedLiveScores` are upstream IN_PLAY/PAUSED/LIVE/HALF_TIME rows
 * that did NOT find a corresponding `Game` row (typically a team-name
 * mismatch the EN→PT map doesn't cover, or a missing DB seed). They
 * surface as a slim, prediction-less live card so a viewer at least
 * sees the score; downstream computations (ranking, my-status) still
 * skip them since there's no `Game` to fold a score into.
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

  const matchedScoreIds = new Set<number>();
  const liveGames = games.filter((g) => {
    const ls = findLiveScoreForGame(g, liveScores);
    if (ls == null || !isLiveStatus(ls.status)) return false;
    matchedScoreIds.add(ls.id);
    return true;
  });

  const unmatchedLiveScores = liveScores.filter(
    (m) => isLiveStatus(m.status) && !matchedScoreIds.has(m.id)
  );

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

  return { liveGames, unmatchedLiveScores, secondsUntilNextKickoff };
}
