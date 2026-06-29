import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KnockoutBracketPreview } from "../KnockoutNextRoundCard";
import { DisplayKnockoutMatch } from "@/lib/knockoutDisplayMatches";

function buildMatch(
  overrides: Partial<DisplayKnockoutMatch> = {}
): DisplayKnockoutMatch {
  return {
    id: 1,
    round: "r32",
    match_number: 1,
    home_slot: "1A",
    away_slot: "2B",
    home_team: null,
    away_team: null,
    official_score_home: null,
    official_score_away: null,
    winner_team: null,
    match_date: "2026-07-04T20:00:00.000Z",
    locked: false,
    display_home_team: null,
    display_away_team: null,
    ...overrides,
  };
}

describe("KnockoutBracketPreview", () => {
  it("renders both round columns with their team data", () => {
    render(
      <KnockoutBracketPreview
        currentRound="r32"
        currentMatches={[
          buildMatch({
            id: 1,
            round: "r32",
            display_home_team: "Brasil",
            display_away_team: "Argentina",
          }),
        ]}
        nextRound="r16"
        nextMatches={[
          buildMatch({
            id: 10,
            round: "r16",
            match_number: 1,
            home_slot: "W1",
            away_slot: "W2",
            display_home_team: "Brasil",
            display_away_team: null,
          }),
        ]}
      />
    );
    expect(screen.getByText("16 avos")).toBeInTheDocument();
    expect(screen.getByText("Oitavas")).toBeInTheDocument();
    expect(screen.getByText("Argentina")).toBeInTheDocument();
  });

  it("links the heading to /mata-mata", () => {
    render(
      <KnockoutBracketPreview
        currentRound="r32"
        currentMatches={[]}
        nextRound="r16"
        nextMatches={[]}
      />
    );
    const link = screen.getByRole("link", { name: /Ver chaveamento/ });
    expect(link.getAttribute("href")).toBe("/mata-mata");
  });

  it("returns nothing when both rounds are missing", () => {
    const { container } = render(
      <KnockoutBracketPreview
        currentRound={null}
        currentMatches={[]}
        nextRound={null}
        nextMatches={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
