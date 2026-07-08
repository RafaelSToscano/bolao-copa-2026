import { describe, it, expect, beforeEach, vi } from "vitest";
import { __resetMemoryCacheForTests } from "@/lib/server/memoryCache";

const supabaseFromMock = vi.fn();

vi.mock("@/services/supabase/supabaseClient", () => ({
  getSupabaseClient: () => ({
    from: supabaseFromMock,
  }),
}));

function setAdminLookup({
  isAdmin,
  notFound,
}: {
  isAdmin?: boolean;
  notFound?: boolean;
}) {
  supabaseFromMock.mockImplementation(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(async () =>
          notFound
            ? { data: null, error: null }
            : { data: { is_admin: isAdmin ?? false }, error: null }
        ),
      })),
    })),
  }));
}

async function postEvict(body: unknown) {
  const { POST } = await import("@/app/api/dashboard/cache/evict/route");
  const { NextRequest } = await import("next/server");
  const req = new NextRequest("http://localhost/api/dashboard/cache/evict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return POST(req);
}

describe("/api/dashboard/cache/evict", () => {
  beforeEach(() => {
    __resetMemoryCacheForTests();
    vi.clearAllMocks();
  });

  it("rejects malformed JSON bodies", async () => {
    setAdminLookup({ isAdmin: true });
    const res = await postEvict("{not json");
    expect(res.status).toBe(400);
  });

  it("rejects missing or malformed userId", async () => {
    setAdminLookup({ isAdmin: true });
    expect((await postEvict({})).status).toBe(400);
    expect((await postEvict({ userId: 42 })).status).toBe(400);
    expect(
      (
        await postEvict({
          userId: "../../etc/passwd",
        })
      ).status
    ).toBe(400);
  });

  it("returns 403 when the user is not an admin", async () => {
    setAdminLookup({ isAdmin: false });
    const res = await postEvict({ userId: "user-123" });
    expect(res.status).toBe(403);
  });

  it("returns 403 when the user does not exist", async () => {
    setAdminLookup({ notFound: true });
    const res = await postEvict({ userId: "ghost-id" });
    expect(res.status).toBe(403);
  });

  it("evicts dashboard caches when the user is an admin", async () => {
    setAdminLookup({ isAdmin: true });
    const { withCache } = await import("@/lib/server/memoryCache");

    const loader = vi.fn(async () => ({ value: "v1" }));
    await withCache("dashboard:test-key", 60, loader);
    await withCache("dashboard:test-key", 60, loader);
    expect(loader).toHaveBeenCalledTimes(1); // cached

    const res = await postEvict({ userId: "admin-1" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.evicted).toBe(true);

    // After eviction, the same key triggers a fresh loader call.
    await withCache("dashboard:test-key", 60, loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("returns Cache-Control: no-store on success", async () => {
    setAdminLookup({ isAdmin: true });
    const res = await postEvict({ userId: "admin-1" });
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  describe("scope=user-predictions", () => {
    it("does not require admin", async () => {
      setAdminLookup({ isAdmin: false });
      const res = await postEvict({
        userId: "player-42",
        scope: "user-predictions",
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        evicted: true,
        scope: "user-predictions",
      });
    });

    it("still validates the userId shape", async () => {
      const res = await postEvict({
        userId: "../../etc/passwd",
        scope: "user-predictions",
      });
      expect(res.status).toBe(400);
    });

    it("evicts shared caches + the caller's projections, leaves the rest cached", async () => {
      const { withCache } = await import("@/lib/server/memoryCache");

      const rankingLoader = vi.fn(async () => ({ v: "ranking" }));
      const finalPredLoader = vi.fn(async () => ({ v: "final" }));
      const bootstrapOwnMineLoader = vi.fn(async () => ({ v: "boot-mine" }));
      const bootstrapOwnOtherLoader = vi.fn(async () => ({ v: "boot-other" }));
      const bootstrapAllLoader = vi.fn(async () => ({ v: "boot-all" }));
      const myStatusLoader = vi.fn(async () => ({ v: "self-status" }));
      const otherStatusLoader = vi.fn(async () => ({ v: "other-status" }));
      const myRecentLoader = vi.fn(async () => ({ v: "self-recent" }));
      const upcomingLoader = vi.fn(async () => ({ v: "upcoming" }));

      await withCache("dashboard:ranking-base-data", 60, rankingLoader);
      await withCache("dashboard:final-predictions", 60, finalPredLoader);
      await withCache("dashboard:bootstrap:own:player-42", 60, bootstrapOwnMineLoader);
      await withCache("dashboard:bootstrap:own:player-99", 60, bootstrapOwnOtherLoader);
      await withCache("dashboard:bootstrap:all", 60, bootstrapAllLoader);
      await withCache("dashboard:my-status:player-42", 60, myStatusLoader);
      await withCache("dashboard:my-status:player-99", 60, otherStatusLoader);
      await withCache("dashboard:recent:player-42", 60, myRecentLoader);
      await withCache("dashboard:upcoming", 60, upcomingLoader);

      const res = await postEvict({
        userId: "player-42",
        scope: "user-predictions",
      });
      expect(res.status).toBe(200);

      await withCache("dashboard:ranking-base-data", 60, rankingLoader);
      await withCache("dashboard:final-predictions", 60, finalPredLoader);
      await withCache("dashboard:bootstrap:own:player-42", 60, bootstrapOwnMineLoader);
      await withCache("dashboard:bootstrap:own:player-99", 60, bootstrapOwnOtherLoader);
      await withCache("dashboard:bootstrap:all", 60, bootstrapAllLoader);
      await withCache("dashboard:my-status:player-42", 60, myStatusLoader);
      await withCache("dashboard:my-status:player-99", 60, otherStatusLoader);
      await withCache("dashboard:recent:player-42", 60, myRecentLoader);
      await withCache("dashboard:upcoming", 60, upcomingLoader);

      // Evicted keys re-run their loaders.
      expect(rankingLoader).toHaveBeenCalledTimes(2);
      expect(finalPredLoader).toHaveBeenCalledTimes(2);
      expect(bootstrapOwnMineLoader).toHaveBeenCalledTimes(2);
      expect(bootstrapAllLoader).toHaveBeenCalledTimes(2);
      expect(myStatusLoader).toHaveBeenCalledTimes(2);
      expect(myRecentLoader).toHaveBeenCalledTimes(2);
      // Untouched keys stay cached — other users' bootstrap/status and
      // unrelated slice caches (upcoming) are unaffected.
      expect(bootstrapOwnOtherLoader).toHaveBeenCalledTimes(1);
      expect(otherStatusLoader).toHaveBeenCalledTimes(1);
      expect(upcomingLoader).toHaveBeenCalledTimes(1);
    });
  });
});
