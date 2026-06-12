import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@/test/utils";
import { MatchCard } from "./MatchCard";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { LiveScoreMatch } from "@/hooks/useLiveScores";

function makeGame(overrides: Partial<Game> = {}): Game {
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

function makePrediction(overrides: Partial<Prediction> = {}): Prediction {
  return {
    player_id: "p1",
    game_id: "g1",
    predicted_score_a: 2,
    predicted_score_b: 1,
    ...overrides,
  };
}

describe("MatchCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-20T18:30:00.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("shared rendering", () => {
    it("renders both team names in both modes", () => {
      const game = makeGame();
      const { rerender } = render(<MatchCard game={game} mode="live" />);
      expect(screen.getByText("Brasil")).toBeInTheDocument();
      expect(screen.getByText("Argentina")).toBeInTheDocument();

      rerender(<MatchCard game={game} mode="prediction" />);
      expect(screen.getByText("Brasil")).toBeInTheDocument();
      expect(screen.getByText("Argentina")).toBeInTheDocument();
    });

    it("renders the user's saved prediction in both modes", () => {
      const game = makeGame();
      const prediction = makePrediction({ predicted_score_a: 3, predicted_score_b: 2 });

      const { rerender } = render(
        <MatchCard game={game} prediction={prediction} mode="live" />
      );
      expect(screen.getByText("Seu palpite")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();

      rerender(<MatchCard game={game} prediction={prediction} mode="prediction" />);
      expect(screen.getByText("Seu palpite")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it('shows "Sem palpite" when prediction is missing', () => {
      const game = makeGame();
      render(<MatchCard game={game} mode="prediction" />);
      expect(screen.getByText("Sem palpite")).toBeInTheDocument();
    });
  });

  describe("theme switching", () => {
    it("applies the live theme container class when mode=live", () => {
      const { getByTestId } = render(
        <MatchCard game={makeGame()} mode="live" />
      );
      const card = getByTestId("match-card");
      expect(card).toHaveAttribute("data-mode", "live");
      expect(card.className).toContain("border-amber-500/30");
    });

    it("applies the prediction theme container class when mode=prediction", () => {
      const { getByTestId } = render(
        <MatchCard game={makeGame()} mode="prediction" />
      );
      const card = getByTestId("match-card");
      expect(card).toHaveAttribute("data-mode", "prediction");
      expect(card.className).toContain("border-[#2A398D]/50");
    });
  });

  describe("live mode", () => {
    it("shows the live score when liveScore is provided", () => {
      const game = makeGame();
      const liveScore: LiveScoreMatch = {
        id: 1,
        utcDate: "2026-06-20T18:00:00.000Z",
        status: "IN_PLAY",
        homeTeam: "Brasil",
        awayTeam: "Argentina",
        homeScore: 4,
        awayScore: 0,
      };
      render(<MatchCard game={game} mode="live" liveScore={liveScore} />);
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("falls back to dashes when no live or official score is available", () => {
      render(<MatchCard game={makeGame()} mode="live" liveScore={null} />);
      expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
    });

    it("renders the elapsed-minute label in live mode", () => {
      vi.setSystemTime(new Date("2026-06-20T18:23:00.000Z"));
      const game = makeGame();
      render(<MatchCard game={game} mode="live" />);
      expect(screen.getByText(/⏱/)).toBeInTheDocument();
      expect(screen.getByText(/23'/)).toBeInTheDocument();
    });
  });

  describe("prediction mode", () => {
    it("does not render a live score even if liveScore is passed", () => {
      const liveScore: LiveScoreMatch = {
        id: 1,
        utcDate: "2026-06-20T18:00:00.000Z",
        status: "IN_PLAY",
        homeTeam: "Brasil",
        awayTeam: "Argentina",
        homeScore: 9,
        awayScore: 9,
      };
      render(
        <MatchCard
          game={makeGame()}
          mode="prediction"
          liveScore={liveScore}
        />
      );
      expect(screen.queryByText("9")).not.toBeInTheDocument();
    });

    it("renders the kickoff time label", () => {
      const game = makeGame({ match_date: "2026-06-20T18:00:00.000Z" });
      render(<MatchCard game={game} mode="prediction" />);
      expect(screen.getByText("Kick-off")).toBeInTheDocument();
    });

    it("renders the próximo jogo pill", () => {
      render(<MatchCard game={makeGame()} mode="prediction" />);
      expect(screen.getByText(/Próximo jogo/i)).toBeInTheDocument();
    });
  });
});
