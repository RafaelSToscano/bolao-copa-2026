import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentResultsCard } from "../RecentResultsCard";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";

function game(
  id: string,
  scoreA: number,
  scoreB: number,
  teamA = "T1",
  teamB = "T2",
  matchDate = "2026-06-15T18:00:00.000Z"
): Game {
  return {
    id,
    phase: "groups",
    group_name: "A",
    match_order: 1,
    match_date: matchDate,
    team_a: teamA,
    team_b: teamB,
    official_score_a: scoreA,
    official_score_b: scoreB,
    locked: true,
  };
}

function pred(gameId: string, a: number, b: number): Prediction {
  return {
    player_id: "u1",
    game_id: gameId,
    predicted_score_a: a,
    predicted_score_b: b,
  };
}

describe("RecentResultsCard", () => {
  it("renders teams, both score panels, weekday date, and points chip", () => {
    const items = [
      { game: game("g1", 1, 0), myPrediction: pred("g1", 1, 0), myPoints: 15 },
    ];
    render(<RecentResultsCard items={items} />);
    expect(screen.getByText("T1")).toBeInTheDocument();
    expect(screen.getByText("T2")).toBeInTheDocument();
    expect(screen.getByText("Resultado")).toBeInTheDocument();
    expect(screen.getByText("Seu palpite")).toBeInTheDocument();
    // Both Resultado and Seu palpite panels show 1 × 0 (exact match).
    expect(screen.getAllByText("1 × 0")).toHaveLength(2);
    expect(screen.getByText(/\+15 pts/)).toBeInTheDocument();
    // Weekday + DD/MM · HH:mm header (15/06/2026 is a Monday → "Seg").
    expect(screen.getByText(/Seg 15\/06 · /)).toBeInTheDocument();
  });

  it("renders distinct scores when the prediction differs from the result", () => {
    const items = [
      { game: game("g1", 2, 1), myPrediction: pred("g1", 1, 1), myPoints: 0 },
    ];
    render(<RecentResultsCard items={items} />);
    expect(screen.getByText("2 × 1")).toBeInTheDocument(); // Resultado
    expect(screen.getByText("1 × 1")).toBeInTheDocument(); // Seu palpite
  });

  it("shows 'Sem palpite' inside the prediction panel when myPrediction is null", () => {
    const items = [{ game: game("g1", 1, 0), myPrediction: null, myPoints: 0 }];
    render(<RecentResultsCard items={items} />);
    expect(screen.getByText("Sem palpite")).toBeInTheDocument();
    expect(screen.getByText("Seu palpite")).toBeInTheDocument();
    // Result panel still shows the score even with no prediction.
    expect(screen.getByText("1 × 0")).toBeInTheDocument();
  });

  it("renders empty state with no items", () => {
    render(<RecentResultsCard items={[]} />);
    expect(screen.getByText(/Aguardando primeiros resultados/)).toBeInTheDocument();
  });

  describe("today's matches", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-20T15:00:00.000Z"));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("highlights matches played today with a 'Hoje' badge", () => {
      const items = [
        {
          game: game("today", 2, 1, "Brasil", "Argentina", "2026-06-20T20:00:00.000Z"),
          myPrediction: null,
          myPoints: 0,
        },
        {
          game: game("yesterday", 0, 0, "México", "Canadá", "2026-06-19T20:00:00.000Z"),
          myPrediction: null,
          myPoints: 0,
        },
      ];
      render(<RecentResultsCard items={items} />);
      expect(screen.getAllByText("Hoje")).toHaveLength(1);
    });
  });
});
