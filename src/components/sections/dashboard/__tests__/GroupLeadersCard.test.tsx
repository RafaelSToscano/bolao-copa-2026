import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GroupLeadersCard } from "../GroupLeadersCard";
import { TeamStanding } from "@/types/standings";

function leader(team: string, points: number, goalDiff: number): TeamStanding {
  return {
    team,
    points,
    played: 1,
    wins: 1,
    draws: 0,
    losses: 0,
    goalsFor: goalDiff > 0 ? goalDiff : 0,
    goalsAgainst: goalDiff < 0 ? -goalDiff : 0,
    goalDiff,
  };
}

describe("GroupLeadersCard", () => {
  it("renders one row per group with the leader's team and points", () => {
    const groups = [
      { group: "A", leader: leader("Brasil", 7, 5) },
      { group: "B", leader: leader("Argentina", 6, 3) },
      { group: "C", leader: null },
    ];
    render(<GroupLeadersCard groups={groups} />);
    expect(screen.getByText("Brasil")).toBeInTheDocument();
    expect(screen.getByText("Argentina")).toBeInTheDocument();
    expect(screen.getByText(/Aguardando primeiro jogo/)).toBeInTheDocument();
  });

  it("renders empty state with no groups", () => {
    render(<GroupLeadersCard groups={[]} />);
    expect(screen.getByText(/Aguardando primeiros jogos/)).toBeInTheDocument();
  });

  it("calls onSeeAll", () => {
    const onSeeAll = vi.fn();
    render(<GroupLeadersCard groups={[]} onSeeAll={onSeeAll} />);
    fireEvent.click(screen.getByText(/Ver classificação/));
    expect(onSeeAll).toHaveBeenCalled();
  });
});
