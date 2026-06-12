import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UpcomingMatchesCard } from "../UpcomingMatchesCard";
import { Game } from "@/types/game";

function game(overrides: Partial<Game>): Game {
  return {
    id: overrides.id ?? "g",
    phase: "groups",
    group_name: "A",
    match_order: 1,
    match_date: "2026-06-20T18:00:00.000Z",
    team_a: "Team A",
    team_b: "Team B",
    official_score_a: null,
    official_score_b: null,
    locked: false,
    ...overrides,
  };
}

describe("UpcomingMatchesCard", () => {
  it("renders all teams from the games list", () => {
    const games = [
      game({ id: "g1", team_a: "Brasil", team_b: "Argentina" }),
      game({ id: "g2", team_a: "México", team_b: "Canadá" }),
    ];
    render(<UpcomingMatchesCard games={games} />);
    expect(screen.getByText("Brasil")).toBeInTheDocument();
    expect(screen.getByText("Argentina")).toBeInTheDocument();
    expect(screen.getByText("México")).toBeInTheDocument();
    expect(screen.getByText("Canadá")).toBeInTheDocument();
  });

  it("renders empty state when no games", () => {
    render(<UpcomingMatchesCard games={[]} />);
    expect(screen.getByText(/Nenhum jogo agendado/)).toBeInTheDocument();
  });

  it("does not render a 'Ver todos' link", () => {
    render(<UpcomingMatchesCard games={[game({ id: "g1" })]} />);
    expect(screen.queryByText(/Ver todos/)).not.toBeInTheDocument();
  });
});
