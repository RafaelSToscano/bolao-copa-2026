import { NextResponse } from "next/server";
import { withCache } from "@/lib/server/memoryCache";
import { cachePublic } from "@/lib/server/cacheHeaders";
import { getDashboardRankingBaseData } from "@/services/dashboard/dashboardBaseData";
import { projectGroupLeaders } from "@/services/dashboard/dashboardProjections";

// 3h TTL. Reads only from the shared 3h base-data cache; no direct
// Supabase call under a projection cache miss unless the base cache
// is also cold.
const TTL_SECONDS = 10800;
const SWR_SECONDS = 10800;
const MAX_AGE = 600;

export async function GET() {
  const payload = await withCache(
    "dashboard:group-leaders",
    TTL_SECONDS,
    async () => {
      const base = await getDashboardRankingBaseData();
      return projectGroupLeaders(base.games);
    }
  );

  return NextResponse.json(payload, {
    headers: cachePublic(TTL_SECONDS, SWR_SECONDS, MAX_AGE),
  });
}
