import { withCache } from "./memoryCache";
import { USE_MOCK_DATA, getMockLiveScoresNormalized } from "@/services/mock";
import { LiveScoreMatch } from "@/hooks/useLiveScores";
import { toCanonicalTeamName } from "./teamNames";

const TTL_SECONDS = 8;
const CACHE_KEY = "footballData:matches";

interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  homeTeam?: { name?: string };
  awayTeam?: { name?: string };
  score?: { fullTime?: { home?: number | null; away?: number | null } };
}

async function fetchUpstream(): Promise<LiveScoreMatch[]> {
  if (USE_MOCK_DATA) {
    return getMockLiveScoresNormalized();
  }

  try {
    const response = await fetch("https://api.football-data.org/v4/matches", {
      headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_TOKEN! },
      next: { revalidate: TTL_SECONDS },
    });
    const data = (await response.json()) as { matches?: FootballDataMatch[] };
    return (data.matches || []).map((m) => ({
      id: m.id,
      utcDate: m.utcDate,
      status: m.status,
      homeTeam: toCanonicalTeamName(m.homeTeam?.name ?? ""),
      awayTeam: toCanonicalTeamName(m.awayTeam?.name ?? ""),
      homeScore: m.score?.fullTime?.home ?? null,
      awayScore: m.score?.fullTime?.away ?? null,
    }));
  } catch {
    return [];
  }
}

/**
 * Shared upstream live-score fetcher. Cached in-memory for `TTL_SECONDS`
 * so the live route AND ranking-top / my-status routes (which fold live
 * scores into the ranking computation) share a single upstream call per
 * cache window.
 */
export function getCachedLiveScores(): Promise<LiveScoreMatch[]> {
  return withCache(CACHE_KEY, TTL_SECONDS, fetchUpstream);
}

export const FOOTBALL_DATA_TTL_SECONDS = TTL_SECONDS;
