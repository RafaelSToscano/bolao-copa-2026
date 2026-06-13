import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardSection } from "./DashboardSection";

const baseResponses = () => ({
  "/api/dashboard/ranking-top": {
    top: [
      {
        id: "u1",
        name: "Top Player",
        access_code: "1",
        is_admin: false,
        approved: true,
        total: 50,
        exacts: 3,
        position: 1,
      },
    ],
    lanterna: null,
  },
  "/api/dashboard/upcoming": {
    games: [
      {
        id: "g1",
        phase: "groups",
        group_name: "A",
        match_order: 1,
        match_date: "2026-06-30T18:00:00.000Z",
        team_a: "Brasil",
        team_b: "Argentina",
        official_score_a: null,
        official_score_b: null,
        locked: false,
      },
    ],
  },
  "/api/dashboard/recent": { items: [] },
  "/api/dashboard/my-status": {
    position: 3,
    total: 21,
    exacts: 1,
    completion: 65,
  },
  "/api/live-scores": { matches: [] },
  "/api/dashboard/group-leaders": {
    groups: [
      {
        group: "A",
        leader: {
          team: "Brasil",
          points: 7,
          played: 3,
          wins: 2,
          draws: 1,
          losses: 0,
          goalsFor: 5,
          goalsAgainst: 1,
          goalDiff: 4,
        },
      },
    ],
  },
});

describe("DashboardSection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders all panels driven by /api/dashboard/* responses", async () => {
    const responses = baseResponses();
    const fetchMock = vi.fn(async (url: string) => {
      const path = url.split("?")[0];
      const body = responses[path as keyof typeof responses] ?? null;
      return { ok: true, json: async () => body } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardSection currentUserId="u1" onNavigate={() => {}} />);

    await vi.waitFor(() => {
      expect(screen.getByText("Top Player")).toBeInTheDocument();
      expect(screen.getAllByText("Brasil").length).toBeGreaterThan(0);
      expect(screen.getByText("3º")).toBeInTheDocument();
      expect(screen.getByText("21")).toBeInTheDocument();
    });

    const calledPaths = new Set(
      fetchMock.mock.calls.map((c) => (c[0] as string).split("?")[0])
    );
    expect(calledPaths).not.toContain("/api/dashboard/live");
    expect(calledPaths).toContain("/api/dashboard/ranking-top");
    expect(calledPaths).toContain("/api/dashboard/upcoming");
    expect(calledPaths).toContain("/api/dashboard/recent");
    expect(calledPaths).toContain("/api/dashboard/my-status");
    expect(calledPaths).toContain("/api/dashboard/group-leaders");
  });
});
