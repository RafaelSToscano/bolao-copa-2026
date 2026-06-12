import { NextRequest, NextResponse } from "next/server";
import { USE_MOCK_DATA, bumpMockGoal } from "@/services/mock";
import { evictByPrefix } from "@/lib/server/memoryCache";

/**
 * Mock-only endpoint: bump a live game's home or away score by N to
 * exercise the dashboard's live-ranking + goal-animation paths during
 * local development. Returns 404 in any non-mock environment so the
 * route doesn't expose mutation surface in production.
 */
export async function POST(req: NextRequest) {
  if (!USE_MOCK_DATA) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { gameId, side, delta } = (body as Record<string, unknown>) ?? {};
  if (typeof gameId !== "string" || !gameId) {
    return NextResponse.json({ error: "gameId required" }, { status: 400 });
  }
  if (side !== "home" && side !== "away") {
    return NextResponse.json({ error: "side must be 'home' or 'away'" }, { status: 400 });
  }
  const numericDelta = typeof delta === "number" ? delta : 1;
  if (!Number.isInteger(numericDelta)) {
    return NextResponse.json({ error: "delta must be integer" }, { status: 400 });
  }

  const result = bumpMockGoal(gameId, side, numericDelta);
  if (!result) {
    return NextResponse.json(
      { error: "Game not found or not live" },
      { status: 404 }
    );
  }

  // Evict downstream projections + the shared upstream live cache so
  // the next dashboard poll picks up the new score immediately.
  evictByPrefix("dashboard:");
  evictByPrefix("footballData:");

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
