import { NextRequest, NextResponse } from "next/server";
import { evictByPrefix } from "@/lib/server/memoryCache";
import { USE_MOCK_DATA, MOCK_PLAYERS } from "@/services/mock";
import { getSupabaseClient } from "@/services/supabase/supabaseClient";

const UUID_OR_MOCK_ID = /^[a-zA-Z0-9-]{1,128}$/;

/**
 * Evicts the dashboard's in-memory caches (slice projections + the
 * shared football-data live-scores cache). Used by the admin
 * "update official result" flow so a freshly-recorded score appears
 * on every viewer's dashboard within a single poll cycle instead of
 * waiting up to s-maxage seconds.
 *
 * Auth posture mirrors the rest of the app: we don't authenticate
 * the userId, only validate its shape and check is_admin server-side.
 * Anyone can poke the endpoint; the worst they can do is force an
 * upstream refresh on the next request.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId } = (body as Record<string, unknown>) ?? {};
  if (typeof userId !== "string" || !UUID_OR_MOCK_ID.test(userId)) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
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
