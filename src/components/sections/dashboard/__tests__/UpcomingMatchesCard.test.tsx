import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UpcomingMatchesCard } from "../UpcomingMatchesCard";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";

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

  describe("user predictions", () => {
    function prediction(overrides: Partial<Prediction>): Prediction {
      return {
        player_id: "u1",
        game_id: "g1",
        predicted_score_a: 1,
        predicted_score_b: 2,
        ...overrides,
      };
    }

    it("renders the user's predicted score for a game they predicted", () => {
      const g = game({ id: "g1", team_a: "Brasil", team_b: "Argentina" });
      render(
        <UpcomingMatchesCard
          games={[g]}
          predictions={[prediction({ game_id: "g1", predicted_score_a: 3, predicted_score_b: 0 })]}
          currentUserId="u1"
        />
      );
      expect(screen.getByText("Palpite")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("falls back to 'Sem palpite' when the user has no prediction", () => {
      const g = game({ id: "g1", team_a: "Brasil", team_b: "Argentina" });
      render(
        <UpcomingMatchesCard
          games={[g]}
          predictions={[]}
          currentUserId="u1"
        />
      );
      expect(screen.getByText("Sem palpite")).toBeInTheDocument();
    });

    it("ignores predictions belonging to other users", () => {
      const g = game({ id: "g1", team_a: "Brasil", team_b: "Argentina" });
      render(
        <UpcomingMatchesCard
          games={[g]}
          predictions={[prediction({ player_id: "someone-else" })]}
          currentUserId="u1"
        />
      );
      expect(screen.getByText("Sem palpite")).toBeInTheDocument();
    });
  });

  describe("today's matches", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-20T15:00:00.000Z"));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("highlights matches scheduled for today with a 'Hoje' badge", () => {
      const games = [
        game({
          id: "today",
          team_a: "Brasil",
          team_b: "Argentina",
          match_date: "2026-06-20T20:00:00.000Z",
        }),
        game({
          id: "tomorrow",
          team_a: "México",
          team_b: "Canadá",
          match_date: "2026-06-21T20:00:00.000Z",
        }),
      ];
      render(<UpcomingMatchesCard games={games} />);
      const badges = screen.getAllByText("Hoje");
      expect(badges).toHaveLength(1);
    });
  });
});
