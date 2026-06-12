import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardLiveCard } from "../DashboardLiveCard";
import { Game } from "@/types/game";
import { LiveScoreMatch } from "@/hooks/useLiveScores";

function makeGame(overrides: Partial<Game>): Game {
  return {
    id: "g1",
    phase: "groups",
    group_name: "A",
    match_order: 1,
    match_date: "2026-06-20T18:00:00.000Z",
    team_a: "Brasil",
    team_b: "Argentina",
    official_score_a: null,
    official_score_b: null,
    locked: false,
    ...overrides,
  };
}

describe("DashboardLiveCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // ~150 minutes after kickoff — match has finished but is still
    // inside the 180-minute live window.
    vi.setSystemTime(new Date("2026-06-20T20:30:00.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("falls back to official score when live API does not return the match", () => {
    const game = makeGame({ official_score_a: 2, official_score_b: 1 });
    const liveScores: LiveScoreMatch[] = [];

    render(<DashboardLiveCard liveGames={[game]} liveScores={liveScores} />);

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/Fim de jogo/)).toBeInTheDocument();
  });

  it("prefers live API score over official when both are present", () => {
    const game = makeGame({ official_score_a: 0, official_score_b: 0 });
    const liveScores: LiveScoreMatch[] = [
      {
        id: 1,
        utcDate: "2026-06-20T18:00:00.000Z",
        status: "IN_PLAY",
        homeTeam: "Brasil",
        awayTeam: "Argentina",
        homeScore: 3,
        awayScore: 2,
      },
    ];

    render(<DashboardLiveCard liveGames={[game]} liveScores={liveScores} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows dashes when neither live nor official score is available", () => {
    const game = makeGame({});
    render(<DashboardLiveCard liveGames={[game]} liveScores={[]} />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});
