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

  it("shows a loading spinner until the initial fetches complete", async () => {
    const responses = baseResponses();
    // Delay every response so the loading state is observable before
    // children mount. Awaited by vi.waitFor below.
    const fetchMock = vi.fn(
      (url: string) =>
        new Promise<Response>((resolve) => {
          const path = url.split("?")[0];
          const body = responses[path as keyof typeof responses] ?? null;
          setTimeout(
            () =>
              resolve({ ok: true, json: async () => body } as Response),
            30
          );
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardSection currentUserId="u1" onNavigate={() => {}} />);

    expect(screen.getByText("Carregando...")).toBeInTheDocument();

    await vi.waitFor(() => {
      expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
      expect(screen.getByText("Top Player")).toBeInTheDocument();
    });
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

  it("keeps the upcoming matches list visible while a live card is on screen", async () => {
    const responses = baseResponses();
    // Game scheduled for 'now' so it matches the live score by team-pair
    // + time proximity inside findLiveScoreForGame.
    const liveGame = {
      id: "g-live",
      phase: "groups",
      group_name: "A",
      match_order: 1,
      match_date: new Date().toISOString(),
      team_a: "Brasil",
      team_b: "Argentina",
      official_score_a: null,
      official_score_b: null,
      locked: false,
    };
    (responses["/api/live-scores"] as { matches: unknown[] }).matches = [
      {
        id: 999,
        utcDate: liveGame.match_date,
        status: "IN_PLAY",
        homeTeam: "Brasil",
        awayTeam: "Argentina",
        homeScore: 0,
        awayScore: 0,
      },
    ];

    const fetchMock = vi.fn(async (url: string) => {
      const path = url.split("?")[0];
      const body = responses[path as keyof typeof responses] ?? null;
      return { ok: true, json: async () => body } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <DashboardSection
        currentUserId="u1"
        games={[liveGame]}
        onNavigate={() => {}}
      />
    );

    await vi.waitFor(() => {
      // Live card is on screen AND the upcoming matches list still
      // renders alongside it — the live card replaces the next-match
      // banner, not the right-column list.
      expect(screen.getByText("Próximos jogos")).toBeInTheDocument();
    });
  });
});
