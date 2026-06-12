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
});
