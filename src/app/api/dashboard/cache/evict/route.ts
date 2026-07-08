import { NextRequest, NextResponse } from "next/server";
import { evictByPrefix } from "@/lib/server/memoryCache";
import { USE_MOCK_DATA, MOCK_PLAYERS } from "@/services/mock";
import { getSupabaseClient } from "@/services/supabase/supabaseClient";

const UUID_OR_MOCK_ID = /^[a-zA-Z0-9-]{1,128}$/;

/**
 * Evicts the dashboard's in-memory caches.
 *
 * Two scopes:
 *  - default (admin-only): flushes every `dashboard:*` and `footballData:*`
 *    entry. Used by the "update official result" flow so a freshly-recorded
 *    score appears on every viewer's dashboard within a single poll cycle.
 *  - `scope: "user-predictions"`: flushes the shared bootstrap/base-data
 *    caches plus the caller's own per-user projections. Called by any
 *    player-save flow — without it the server keeps returning stale
 *    predictions for up to the 3h base-data TTL.
 *
 * Auth posture mirrors the rest of the app: we don't authenticate the
 * userId, only validate its shape. The worst a stranger can do is force
 * an upstream refresh on the next request.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId, scope } = (body as Record<string, unknown>) ?? {};
  if (typeof userId !== "string" || !UUID_OR_MOCK_ID.test(userId)) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  if (scope === "user-predictions") {
    // Base data + final predictions feed every downstream projection,
    // so both must go. Final predictions are cached separately so
    // podium-pick saves need to evict that key explicitly.
    evictByPrefix("dashboard:ranking-base-data");
    evictByPrefix("dashboard:final-predictions");
    // Bootstrap serves both the caller's own snapshot and the shared
    // `all=1` snapshot used by /ranking, /simulador, /palpites-da-galera.
    evictByPrefix(`dashboard:bootstrap:own:${userId}`);
    evictByPrefix("dashboard:bootstrap:all");
    // Per-user projections re-read the base data, but their outer
    // withCache would keep returning the pre-save value for the TTL.
    evictByPrefix(`dashboard:my-status:${userId}`);
    evictByPrefix(`dashboard:recent:${userId}`);

    return NextResponse.json(
      { evicted: true, scope: "user-predictions" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const isAdmin = await checkAdmin(userId);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  evictByPrefix("dashboard:");
  evictByPrefix("footballData:");

  return NextResponse.json(
    { evicted: true },
    { headers: { "Cache-Control": "no-store" } }
  );
}

async function checkAdmin(userId: string): Promise<boolean> {
  if (USE_MOCK_DATA) {
    return MOCK_PLAYERS.some((p) => p.id === userId && p.is_admin);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("players")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return false;
  return data.is_admin === true;
}
