import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RankingTopTen } from "../RankingTopTen";
import { LiveRankingRow } from "@/types/dashboard";

function row(
  id: string,
  total: number,
  position: number,
  exacts = 0,
  officialPosition?: number,
  officialTotal?: number,
  lastRoundDelta = 0
): LiveRankingRow {
  return {
    id,
    name: `Player ${id}`,
    access_code: id,
    is_admin: false,
    approved: true,
    total,
    exacts,
    position,
    officialPosition: officialPosition ?? position,
    officialTotal: officialTotal ?? total,
    lastRoundDelta,
  };
}

describe("RankingTopTen", () => {
  it("renders podium for top 3 with positions and points", () => {
    const top = [
      row("a", 50, 1, 2),
      row("b", 30, 2, 1),
      row("c", 20, 3, 0),
    ];
    render(<RankingTopTen top={top} lanterna={top[2]} />);
    expect(screen.getByText("1º")).toBeInTheDocument();
    expect(screen.getByText("2º")).toBeInTheDocument();
    expect(screen.getByText("3º")).toBeInTheDocument();
    expect(screen.getByText("50 pts")).toBeInTheDocument();
  });

  it("calls onSeeAll when link is clicked", () => {
    const onSeeAll = vi.fn();
    render(<RankingTopTen top={[row("a", 1, 1)]} lanterna={null} onSeeAll={onSeeAll} />);
    fireEvent.click(screen.getByText(/Ver ranking completo/));
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });

  it("renders only available players when fewer than 5", () => {
    const top = [row("a", 10, 1), row("b", 5, 2)];
    render(<RankingTopTen top={top} lanterna={top[1]} />);
    expect(screen.getByText("1º")).toBeInTheDocument();
    expect(screen.getByText("2º")).toBeInTheDocument();
    expect(screen.queryByText("3º")).not.toBeInTheDocument();
  });

  it("renders positions 4-10 as slim rows when available", () => {
    const top = Array.from({ length: 10 }, (_, i) =>
      row(`p${i}`, 100 - i * 10, i + 1)
    );
    render(<RankingTopTen top={top} lanterna={top[9]} />);
    for (const pos of ["4º", "5º", "6º", "7º", "8º", "9º", "10º"]) {
      expect(screen.getByText(pos)).toBeInTheDocument();
    }
  });

  it("ignores rows beyond the 10th position", () => {
    const top = Array.from({ length: 12 }, (_, i) =>
      row(`p${i}`, 100 - i * 10, i + 1)
    );
    render(<RankingTopTen top={top} lanterna={top[11]} />);
    expect(screen.getByText("10º")).toBeInTheDocument();
    expect(screen.queryByText("11º")).not.toBeInTheDocument();
    expect(screen.queryByText("12º")).not.toBeInTheDocument();
  });

  it("renders empty state when no players", () => {
    render(<RankingTopTen top={[]} lanterna={null} />);
    expect(screen.getByText(/Aguardando primeiros pontos/)).toBeInTheDocument();
  });

  it("shows +N delta when the live position is better than the DB position", () => {
    // DB: a=1, b=2, c=3 (officialPosition reflects that)
    // Live: c climbs to 1, a drops to 3, b stays 2
    const top: LiveRankingRow[] = [
      row("c", 60, 1, 0, 3, 20),
      row("b", 40, 2, 0, 2, 40),
      row("a", 30, 3, 0, 1, 50),
    ];
    render(<RankingTopTen top={top} lanterna={top[2]} provisional />);
    expect(screen.getByText("+2")).toBeInTheDocument(); // c moved from 3 → 1
    expect(screen.getByText("-2")).toBeInTheDocument(); // a moved from 1 → 3
  });

  it("shows last-round delta when there is no live match", () => {
    // No provisional points → arrows mirror the Ranking screen and
    // report movement since the last completed round.
    const top: LiveRankingRow[] = [
      row("a", 50, 1, 0, 1, 50, 2), // climbed 2
      row("b", 40, 2, 0, 2, 40, 0), // unchanged
      row("c", 30, 3, 0, 3, 30, -1), // dropped 1
    ];
    render(<RankingTopTen top={top} lanterna={top[2]} />);
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getByText("-1")).toBeInTheDocument();
  });

  it("hides arrows when no movement has happened yet", () => {
    const top: LiveRankingRow[] = [row("a", 0, 1), row("b", 0, 1)];
    render(<RankingTopTen top={top} lanterna={top[1]} />);
    expect(screen.queryByText(/^[+-]\d+$/)).toBeNull();
  });

  it("renders a 'Você' self-row when the user is outside top 10 and relegation", () => {
    const top = Array.from({ length: 10 }, (_, i) =>
      row(`p${i}`, 100 - i * 10, i + 1)
    );
    const relegation = Array.from({ length: 5 }, (_, i) =>
      row(`r${i}`, 10 - i, 20 - i)
    );
    const me = row("me", 30, 15);
    render(
      <RankingTopTen
        top={top}
        lanterna={relegation[4]}
        relegationZone={relegation}
        currentUser={me}
      />
    );
    expect(screen.getByText("Você")).toBeInTheDocument();
    expect(screen.getByText("Player me")).toBeInTheDocument();
    expect(screen.getByText("15º")).toBeInTheDocument();
  });

  it("does not render the self-row when the user is already inside the top 10", () => {
    const top = Array.from({ length: 10 }, (_, i) =>
      row(`p${i}`, 100 - i * 10, i + 1)
    );
    const me = top[4]; // 5th place — already visible
    render(
      <RankingTopTen
        top={top}
        lanterna={top[9]}
        currentUser={me}
      />
    );
    expect(screen.queryByText("Você")).toBeNull();
  });

  it("does not render the self-row when the user is in the relegation zone", () => {
    const top = Array.from({ length: 10 }, (_, i) =>
      row(`p${i}`, 100 - i * 10, i + 1)
    );
    const relegation = [row("me", 5, 16), row("rb", 4, 17)];
    render(
      <RankingTopTen
        top={top}
        lanterna={relegation[1]}
        relegationZone={relegation}
        currentUser={relegation[0]}
      />
    );
    expect(screen.queryByText("Você")).toBeNull();
  });
});
