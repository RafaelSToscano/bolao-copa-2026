import { describe, it, expect, beforeEach, vi } from "vitest";
import { __resetMemoryCacheForTests } from "@/lib/server/memoryCache";

vi.mock("@/services/supabase/playersService", () => ({
  playersService: {
    getAllPlayers: vi.fn(async () => []),
  },
}));
vi.mock("@/services/supabase/gamesService", () => ({
  gamesService: {
    getAllGames: vi.fn(async () => []),
  },
}));
vi.mock("@/services/supabase/predictionsService", () => ({
  predictionsService: {
    getAllPredictions: vi.fn(async () => []),
    getPredictionsForPlayer: vi.fn(async () => []),
  },
}));

describe("dashboard route handlers", () => {
  beforeEach(() => {
    __resetMemoryCacheForTests();
    vi.clearAllMocks();
  });

  it("/api/dashboard/ranking-top returns shaped payload", async () => {
    const { GET } = await import("@/app/api/dashboard/ranking-top/route");
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveProperty("top");
    expect(body).toHaveProperty("lanterna");
    expect(res.headers.get("Cache-Control")).toMatch(/public/);
  });

  it("/api/dashboard/upcoming returns games array", async () => {
    const { GET } = await import("@/app/api/dashboard/upcoming/route");
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveProperty("games");
    expect(Array.isArray(body.games)).toBe(true);
  });

  it("/api/dashboard/recent returns items array; accepts userId", async () => {
    const { GET } = await import("@/app/api/dashboard/recent/route");
    const req = new Request("http://localhost/api/dashboard/recent?userId=user-123");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest(req));
    const body = await res.json();
    expect(body).toHaveProperty("items");
  });

  it("/api/dashboard/recent rejects malformed userId", async () => {
    const { GET } = await import("@/app/api/dashboard/recent/route");
    const req = new Request(
      "http://localhost/api/dashboard/recent?userId=" + encodeURIComponent("../../etc/passwd")
    );
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest(req));
    expect(res.status).toBe(400);
  });

  it("/api/dashboard/my-status requires a userId", async () => {
    const { GET } = await import("@/app/api/dashboard/my-status/route");
    const req = new Request("http://localhost/api/dashboard/my-status");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest(req));
    expect(res.status).toBe(400);
  });

  it("/api/dashboard/my-status sets private Cache-Control", async () => {
    const { GET } = await import("@/app/api/dashboard/my-status/route");
    const req = new Request("http://localhost/api/dashboard/my-status?userId=user-123");
    const { NextRequest } = await import("next/server");
    const res = await GET(new NextRequest(req));
    const cc = res.headers.get("Cache-Control") ?? "";
    expect(cc).toMatch(/private/);
    expect(cc).not.toMatch(/public/);
  });

  it("/api/dashboard/group-leaders returns groups array", async () => {
    const { GET } = await import("@/app/api/dashboard/group-leaders/route");
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveProperty("groups");
    expect(Array.isArray(body.groups)).toBe(true);
  });

  it("/api/live-scores returns the normalized LiveScoreMatch[] shape", async () => {
    const { GET } = await import("@/app/api/live-scores/route");
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveProperty("matches");
    expect(Array.isArray(body.matches)).toBe(true);
    if (body.matches.length > 0) {
      const m = body.matches[0];
      // Server must ship the already-normalized shape so the client
      // hook doesn't have to know about football-data's nested
      // score.fullTime.{home,away} JSON.
      expect(m).toHaveProperty("homeScore");
      expect(m).toHaveProperty("awayScore");
      expect(m).toHaveProperty("homeTeam");
      expect(typeof m.homeTeam).toBe("string");
    }
    expect(res.headers.get("Cache-Control")).toMatch(/public/);
  });

});
