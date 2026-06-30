import { describe, it, expect } from "vitest";
import { render } from "@/test/utils";
import {
  BRACKET_ROUND_ORDER_BY_MATCH_NUMBER,
  BracketColumn,
  KnockoutBracketView,
  buildRoundSlots,
  splitRoundSlots,
} from "@/components/sections/KnockoutBracketView";
import { DisplayKnockoutMatch } from "@/lib/knockoutDisplayMatches";
import { KnockoutRound } from "@/types/knockout";

function makeMatch(
  round: KnockoutRound,
  matchNumber: number,
  overrides: Partial<DisplayKnockoutMatch> = {}
): DisplayKnockoutMatch {
  return {
    id: matchNumber + (round === "r32" ? 0 : round === "r16" ? 100 : round === "qf" ? 200 : round === "sf" ? 300 : 400),
    round,
    match_number: matchNumber,
    home_slot: "",
    away_slot: "",
    home_team: null,
    away_team: null,
    official_score_home: null,
    official_score_away: null,
    winner_team: null,
    match_date: null,
    locked: false,
    display_home_team: `H${matchNumber}`,
    display_away_team: `A${matchNumber}`,
    ...overrides,
  };
}

describe("splitRoundSlots", () => {
  it("splits r32 into 8 + 8 in bracket order", () => {
    const matches = BRACKET_ROUND_ORDER_BY_MATCH_NUMBER.r32.map((n) =>
      makeMatch("r32", n)
    );
    const full = buildRoundSlots("r32", matches);
    const { top, bottom } = splitRoundSlots("r32", matches);

    expect(top).toHaveLength(8);
    expect(bottom).toHaveLength(8);
    expect(top).toEqual(full.slice(0, 8));
    expect(bottom).toEqual(full.slice(8));
  });

  it("splits r16 into 4 + 4", () => {
    const matches = BRACKET_ROUND_ORDER_BY_MATCH_NUMBER.r16.map((n) =>
      makeMatch("r16", n)
    );
    const { top, bottom } = splitRoundSlots("r16", matches);
    expect(top).toHaveLength(4);
    expect(bottom).toHaveLength(4);
  });

  it("splits qf into 2 + 2", () => {
    const matches = BRACKET_ROUND_ORDER_BY_MATCH_NUMBER.qf.map((n) =>
      makeMatch("qf", n)
    );
    const { top, bottom } = splitRoundSlots("qf", matches);
    expect(top).toHaveLength(2);
    expect(bottom).toHaveLength(2);
  });

  it("splits sf into 1 + 1", () => {
    const matches = BRACKET_ROUND_ORDER_BY_MATCH_NUMBER.sf.map((n) =>
      makeMatch("sf", n)
    );
    const { top, bottom } = splitRoundSlots("sf", matches);
    expect(top).toHaveLength(1);
    expect(bottom).toHaveLength(1);
  });

  it("keeps final in top and leaves bottom empty", () => {
    const matches = [makeMatch("final", 1)];
    const { top, bottom } = splitRoundSlots("final", matches);
    expect(top).toHaveLength(1);
    expect(bottom).toHaveLength(0);
  });
});

describe("BracketColumn mirrored", () => {
  function styleOf(el: Element) {
    return (el as HTMLElement).getAttribute("style") ?? "";
  }

  it("flips connector inline positions from right to left when mirrored", () => {
    const matches = [makeMatch("r16", 1), makeMatch("r16", 2)];
    const slots = buildRoundSlots("r16", matches).slice(0, 2);

    const { container } = render(
      <div style={{ width: 1200 }}>
        <BracketColumn
          round="r16"
          slots={slots}
          isLastRound={false}
          mirrored
        />
      </div>
    );

    const spans = Array.from(container.querySelectorAll("span[aria-hidden]"));
    expect(spans.length).toBeGreaterThan(0);

    const inlineRight = spans.filter((s) =>
      /(^|;\s*)right:/.test(styleOf(s))
    );
    const inlineLeft = spans.filter((s) =>
      /(^|;\s*)left:/.test(styleOf(s))
    );

    expect(inlineRight.length).toBe(0);
    expect(inlineLeft.length).toBeGreaterThan(0);
  });

  it("keeps connectors pinned to the right edge by default", () => {
    const matches = [makeMatch("r16", 1), makeMatch("r16", 2)];
    const slots = buildRoundSlots("r16", matches).slice(0, 2);

    const { container } = render(
      <div style={{ width: 1200 }}>
        <BracketColumn round="r16" slots={slots} isLastRound={false} />
      </div>
    );

    const spans = Array.from(container.querySelectorAll("span[aria-hidden]"));
    expect(spans.length).toBeGreaterThan(0);

    const inlineRight = spans.filter((s) =>
      /(^|;\s*)right:/.test(styleOf(s))
    );
    const inlineLeft = spans.filter((s) =>
      /(^|;\s*)left:/.test(styleOf(s))
    );

    expect(inlineLeft.length).toBe(0);
    expect(inlineRight.length).toBeGreaterThan(0);
  });
});

describe("KnockoutBracketView layouts", () => {
  function buildFullBracket(): DisplayKnockoutMatch[] {
    const allRounds: KnockoutRound[] = ["r32", "r16", "qf", "sf", "final"];
    return allRounds.flatMap((round) =>
      BRACKET_ROUND_ORDER_BY_MATCH_NUMBER[
        round as keyof typeof BRACKET_ROUND_ORDER_BY_MATCH_NUMBER
      ].map((n) => makeMatch(round, n))
    );
  }

  it("renders the mobile flat row and the desktop mirror in the same tree", () => {
    const matches = buildFullBracket();
    const { container } = render(<KnockoutBracketView matches={matches} />);

    // Mobile wrapper has md:hidden; desktop has hidden md:flex. Both DOMs
    // mount — visibility is purely a CSS concern — so we can assert on the
    // duplicated [data-round] columns to know both variants rendered.
    const r16Columns = container.querySelectorAll('[data-round="r16"]');

    // 1 in the mobile single column + 2 halves on the desktop mirror = 3.
    expect(r16Columns.length).toBe(3);
  });

  it("places the Final between the desktop left-sf and right-sf columns", () => {
    const matches = buildFullBracket();
    const { container } = render(<KnockoutBracketView matches={matches} />);

    const desktopWrapper = container.querySelector(
      "[data-bracket-variant='desktop']"
    );
    expect(desktopWrapper).not.toBeNull();

    const rounds = Array.from(
      desktopWrapper!.querySelectorAll<HTMLElement>("[data-round]")
    ).map((el) => el.dataset.round);

    // Left half goes r32→r16→qf→sf, then Final in the middle, then mirrored
    // sf→qf→r16→r32 on the right.
    expect(rounds).toEqual([
      "r32",
      "r16",
      "qf",
      "sf",
      "final",
      "sf",
      "qf",
      "r16",
      "r32",
    ]);
  });
});
