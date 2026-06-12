import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentResultsCard } from "../RecentResultsCard";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";

function game(id: string, scoreA: number, scoreB: number, teamA = "T1", teamB = "T2"): Game {
  return {
    id,
    phase: "groups",
    group_name: "A",
    match_order: 1,
    match_date: "2026-06-15T18:00:00.000Z",
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
  it("renders official score and prediction with exact-match badge", () => {
    const items = [
      { game: game("g1", 1, 0), myPrediction: pred("g1", 1, 0), myPoints: 15 },
    ];
    render(<RecentResultsCard items={items} />);
    expect(screen.getByText("T1")).toBeInTheDocument();
    expect(screen.getByText(/\+15 pts/)).toBeInTheDocument();
    expect(screen.getByText(/Seu palpite/)).toBeInTheDocument();
  });

  it("shows 'Sem palpite' when myPrediction is null", () => {
    const items = [{ game: game("g1", 1, 0), myPrediction: null, myPoints: 0 }];
    render(<RecentResultsCard items={items} />);
    expect(screen.getByText("Sem palpite")).toBeInTheDocument();
  });

  it("renders empty state with no items", () => {
    render(<RecentResultsCard items={[]} />);
    expect(screen.getByText(/Aguardando primeiros resultados/)).toBeInTheDocument();
  });
});
