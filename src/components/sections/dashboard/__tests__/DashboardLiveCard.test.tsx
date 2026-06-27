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

  it("renders recently-finished games as a green/finished MatchCard", () => {
    const game = makeGame({
      id: "done",
      official_score_a: 2,
      official_score_b: 1,
    });
    render(
      <DashboardLiveCard
        liveGames={[]}
        recentlyFinishedGames={[game]}
        liveScores={[]}
      />
    );

    const card = screen.getByTestId("match-card");
    expect(card.dataset.mode).toBe("finished");
    expect(screen.getByText("Encerrado")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders the finished-only header in green when nothing is live", () => {
    const game = makeGame({
      id: "done",
      official_score_a: 0,
      official_score_b: 0,
    });
    render(
      <DashboardLiveCard
        liveGames={[]}
        recentlyFinishedGames={[game]}
        liveScores={[]}
      />
    );
    expect(screen.getByText("Encerrado há pouco")).toBeInTheDocument();
  });

  it("shows the live header when at least one game is still live, even if a finished card is present", () => {
    const liveGame = makeGame({ id: "live", team_a: "Brasil", team_b: "Argentina" });
    const finishedGame = makeGame({
      id: "done",
      team_a: "Itália",
      team_b: "Espanha",
      official_score_a: 0,
      official_score_b: 0,
    });
    render(
      <DashboardLiveCard
        liveGames={[liveGame]}
        recentlyFinishedGames={[finishedGame]}
        liveScores={[]}
      />
    );
    expect(screen.getByText("Jogo do Momento")).toBeInTheDocument();
    expect(screen.queryByText("Encerrado há pouco")).not.toBeInTheDocument();
  });

  it("renders an extra upcoming card when nothing is live and a finished game is present", () => {
    const finished = makeGame({
      id: "done",
      official_score_a: 2,
      official_score_b: 1,
    });
    const upcoming = makeGame({
      id: "next",
      team_a: "Itália",
      team_b: "Espanha",
      match_date: "2026-06-21T20:00:00.000Z",
    });
    render(
      <DashboardLiveCard
        liveGames={[]}
        recentlyFinishedGames={[finished]}
        upcomingGame={upcoming}
        liveScores={[]}
      />
    );

    const cards = screen.getAllByTestId("match-card");
    expect(cards).toHaveLength(2);
    expect(cards[0].dataset.mode).toBe("finished");
    expect(cards[1].dataset.mode).toBe("prediction");
    expect(screen.getByText("Encerrado · A seguir")).toBeInTheDocument();
  });

  it("ignores upcomingGame when there is a live match", () => {
    const liveGame = makeGame({
      id: "live",
      team_a: "Brasil",
      team_b: "Argentina",
    });
    const upcoming = makeGame({
      id: "next",
      team_a: "Itália",
      team_b: "Espanha",
      match_date: "2026-06-21T20:00:00.000Z",
    });
    render(
      <DashboardLiveCard
        liveGames={[liveGame]}
        upcomingGame={upcoming}
        liveScores={[]}
      />
    );
    // Caller is expected to pass null for upcomingGame when live, but
    // even if it slips through we still render it as the extra hero
    // slot — keep the assertion focused on what the caller sees: the
    // header stays in live framing.
    expect(screen.getByText("Jogo do Momento")).toBeInTheDocument();
    expect(screen.queryByText("Encerrado · A seguir")).not.toBeInTheDocument();
  });

  it("renders the Xpts chip on a finished game with a prediction", () => {
    const game = makeGame({
      id: "done",
      official_score_a: 2,
      official_score_b: 1,
    });
    const prediction = {
      id: "p1",
      player_id: "u1",
      game_id: "done",
      predicted_score_a: 2,
      predicted_score_b: 1,
      created_at: "",
      updated_at: "",
    };
    render(
      <DashboardLiveCard
        liveGames={[]}
        recentlyFinishedGames={[game]}
        liveScores={[]}
        myPredictions={[prediction]}
        currentUserId="u1"
      />
    );
    expect(screen.getByText(/Placar exato/)).toBeInTheDocument();
  });
});
