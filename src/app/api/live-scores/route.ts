import { NextResponse } from "next/server";
import { getCachedLiveScores, FOOTBALL_DATA_TTL_SECONDS } from "@/lib/server/footballData";
import { cachePublic } from "@/lib/server/cacheHeaders";

const SWR_SECONDS = 20;
const MAX_AGE = 5;

/**
 * Single source of truth for live football-data scores. Returns the
 * already-normalized `LiveScoreMatch[]` shape so every consumer
 * (dashboard live card, palpites banner, goal-detection) reads the
 * same wire format. Server-side ranking/my-status routes call
 * `getCachedLiveScores()` directly and share this cache window.
 */
export async function GET() {
  const matches = await getCachedLiveScores();
  return NextResponse.json(
    { matches },
    { headers: cachePublic(FOOTBALL_DATA_TTL_SECONDS, SWR_SECONDS, MAX_AGE) }
  );
}
