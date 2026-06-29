import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
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
  matchDate = "2026-06-15T18:00:00.000Z",
  overrides: Partial<Game> = {}
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
    ...overrides,
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
  it("renders teams, the official score, the prediction below, weekday date, and points chip", () => {
    const items = [
      { game: game("g1", 2, 1), myPrediction: pred("g1", 2, 1), myPoints: 15 },
    ];
    render(<RecentResultsCard items={items} />);
    expect(screen.getByText("T1")).toBeInTheDocument();
    expect(screen.getByText("T2")).toBeInTheDocument();
    // Official score: digits split across spans for the home/away cells,
    // so we look them up individually rather than as "2 × 1".
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
    // Single "Palpite" pill below the matchup.
    expect(screen.getByText("Palpite")).toBeInTheDocument();
    expect(screen.getByText(/\+15 pts/)).toBeInTheDocument();
    // Weekday + DD/MM · HH:mm header (15/06/2026 is a Monday → "Seg").
    expect(screen.getByText(/Seg 15\/06 · /)).toBeInTheDocument();
  });

  it("renders 'Sem palpite' below the matchup when myPrediction is null", () => {
    const items = [{ game: game("g1", 1, 0), myPrediction: null, myPoints: 0 }];
    render(<RecentResultsCard items={items} />);
    expect(screen.getByText("Sem palpite")).toBeInTheDocument();
    // No "Palpite" pill when there's no prediction.
    expect(screen.queryByText("Palpite")).not.toBeInTheDocument();
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

    it("keeps the amber row highlight but suppresses the 'Hoje' text label", () => {
      // The amber background + left border still mark today's row so
      // the user gets a visual cue; the redundant text label gets
      // dropped because the row already shows the final score.
      const items = [
        {
          game: game("today", 2, 1, "Brasil", "Argentina", "2026-06-20T20:00:00.000Z"),
          myPrediction: null,
          myPoints: 0,
        },
      ];
      const { container } = render(<RecentResultsCard items={items} />);
      expect(screen.queryByText("Hoje")).not.toBeInTheDocument();
      expect(
        container.querySelector(".bg-amber-500\\/\\[0\\.04\\]")
      ).not.toBeNull();
    });
  });

  describe("phase label", () => {
    it("renders 'Grupo X' for group-phase games", () => {
      const items = [
        {
          game: game("g1", 1, 0, "Brasil", "Argentina", "2026-06-15T18:00:00.000Z", {
            phase: "groups",
            group_name: "C",
          }),
          myPrediction: null,
          myPoints: 0,
        },
      ];
      render(<RecentResultsCard items={items} />);
      expect(screen.getByText(/Grupo C/)).toBeInTheDocument();
    });

    it.each([
      ["r32", "16 avos"],
      ["r16", "Oitavas"],
      ["qf", "Quartas"],
      ["sf", "Semi"],
      ["final", "Final"],
      ["third_place", "3º lugar"],
    ])("renders the round name for knockout phase %s", (phase, label) => {
      const items = [
        {
          game: game("k1", 1, 0, "Brasil", "Argentina", "2026-07-01T18:00:00.000Z", {
            phase,
            // Knockout games carry group_name "Mata-mata" in API payloads;
            // make sure we ignore it in favor of the round name.
            group_name: "Mata-mata",
          }),
          myPrediction: null,
          myPoints: 0,
        },
      ];
      render(<RecentResultsCard items={items} />);
      expect(screen.getByText(new RegExp(label))).toBeInTheDocument();
      expect(screen.queryByText(/Grupo /)).not.toBeInTheDocument();
    });
  });
});
