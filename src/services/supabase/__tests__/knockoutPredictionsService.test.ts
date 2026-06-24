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
