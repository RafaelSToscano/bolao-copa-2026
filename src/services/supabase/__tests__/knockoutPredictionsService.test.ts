import { describe, it, expect, vi, beforeEach } from "vitest";
import { Game } from "@/types/game";
import { KnockoutMatch } from "@/types/knockout";

type ExistingRow = { id: number; home_team: string | null; away_team: string | null };

const updateCalls: Array<{ id: number; payload: Record<string, unknown> }> = [];
let existingRows: ExistingRow[] = [];

vi.mock("@/services/supabase/supabaseClient", () => ({
  getSupabaseClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        lte: vi.fn(async () => ({ data: existingRows, error: null })),
      })),
      update: vi.fn((payload: Record<string, unknown>) => ({
        eq: vi.fn(async (_col: string, id: number) => {
          updateCalls.push({ id, payload });
          return { error: null };
        }),
      })),
    })),
  }),
}));

vi.mock("@/services/standings/knockoutQualification", () => ({
  generateRound32: vi.fn(),
}));

import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";
import { generateRound32 } from "@/services/standings/knockoutQualification";

function round32Of(home: string, away: string): KnockoutMatch[] {
  return [
    {
      home: { team: home, position: "1", group: "A", points: 0, goalDiff: 0 },
      away: { team: away, position: "2", group: "B", points: 0, goalDiff: 0 },
    },
  ];
}

function game(
  id: string,
  group: string,
  scoreA: number | null,
  scoreB: number | null
): Game {
  return {
    id,
    phase: "groups",
    group_name: group,
    match_order: 1,
    match_date: null,
    team_a: `${group}-A`,
    team_b: `${group}-B`,
    official_score_a: scoreA,
    official_score_b: scoreB,
    locked: false,
  };
}

describe("knockoutPredictionsService.populateRound32FromGroups", () => {
  beforeEach(() => {
    updateCalls.length = 0;
    existingRows = [];
    vi.mocked(generateRound32).mockReset();
  });

  it("fills both slots for a match with no teams yet", async () => {
    vi.mocked(generateRound32).mockReturnValue(round32Of("Brasil", "Argentina"));
    existingRows = [{ id: 1, home_team: null, away_team: null }];

    await knockoutPredictionsService.populateRound32FromGroups([] as Game[]);

    expect(updateCalls).toEqual([
      { id: 1, payload: { home_team: "Brasil", away_team: "Argentina" } },
    ]);
  });

  it("does not overwrite a manually-set team, but fills the missing side", async () => {
    vi.mocked(generateRound32).mockReturnValue(round32Of("Brasil", "Argentina"));
    existingRows = [{ id: 1, home_team: "Alemanha", away_team: null }];

    await knockoutPredictionsService.populateRound32FromGroups([] as Game[]);

    expect(updateCalls).toEqual([{ id: 1, payload: { away_team: "Argentina" } }]);
  });

  it("skips a match entirely when both teams are already set", async () => {
    vi.mocked(generateRound32).mockReturnValue(round32Of("Brasil", "Argentina"));
    existingRows = [{ id: 1, home_team: "Alemanha", away_team: "Espanha" }];

    await knockoutPredictionsService.populateRound32FromGroups([] as Game[]);

    expect(updateCalls).toEqual([]);
  });

  it("excludes games from groups that haven't finished all their matches", async () => {
    vi.mocked(generateRound32).mockReturnValue(round32Of("Brasil", "Argentina"));
    existingRows = [{ id: 1, home_team: null, away_team: null }];

    const games = [
      game("a1", "A", 2, 1),
      game("a2", "A", 1, 1),
      game("b1", "B", 3, 0),
      game("b2", "B", null, null), // group B still has a pending match
    ];

    await knockoutPredictionsService.populateRound32FromGroups(games);

    const passedGames = vi.mocked(generateRound32).mock.calls[0][0];
    expect(passedGames.map((g) => g.id)).toEqual(["a1", "a2"]);
  });
});

describe("knockoutPredictionsService.updateKnockoutMatchTeams", () => {
  beforeEach(() => {
    updateCalls.length = 0;
  });

  it("writes home_team/away_team for the given match", async () => {
    await knockoutPredictionsService.updateKnockoutMatchTeams(5, "Brasil", "Alemanha");

    expect(updateCalls).toEqual([
      { id: 5, payload: { home_team: "Brasil", away_team: "Alemanha" } },
    ]);
  });

  it("clears a side back to unresolved when passed null", async () => {
    await knockoutPredictionsService.updateKnockoutMatchTeams(5, null, "Alemanha");

    expect(updateCalls).toEqual([{ id: 5, payload: { home_team: null, away_team: "Alemanha" } }]);
  });
});

describe("knockoutPredictionsService.setMatchLocked", () => {
  beforeEach(() => {
    updateCalls.length = 0;
  });

  it("locks a single match without touching the others", async () => {
    await knockoutPredictionsService.setMatchLocked(7, true);

    expect(updateCalls).toEqual([{ id: 7, payload: { locked: true } }]);
  });

  it("unlocks a match", async () => {
    await knockoutPredictionsService.setMatchLocked(7, false);

    expect(updateCalls).toEqual([{ id: 7, payload: { locked: false } }]);
  });
});
