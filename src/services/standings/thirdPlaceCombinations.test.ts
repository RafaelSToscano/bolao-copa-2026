import { describe, it, expect } from "vitest";
import {
  THIRD_PLACE_COMBINATIONS,
  THIRD_PLACE_MATCH_SLOTS,
  resolveThirdPlaceOpponents,
} from "./thirdPlaceCombinations";

const ALL_GROUPS = "ABCDEFGHIJKL".split("");

function combinations(groups: string[], size: number): string[][] {
  if (size === 0) return [[]];
  if (groups.length < size) return [];
  const [first, ...rest] = groups;
  const withFirst = combinations(rest, size - 1).map((c) => [first, ...c]);
  const withoutFirst = combinations(rest, size);
  return [...withFirst, ...withoutFirst];
}

describe("THIRD_PLACE_COMBINATIONS (Annexe C)", () => {
  it("has exactly 495 rows", () => {
    expect(THIRD_PLACE_COMBINATIONS).toHaveLength(495);
  });

  it("every row has 8 distinct group letters", () => {
    THIRD_PLACE_COMBINATIONS.forEach((row) => {
      expect(row).toHaveLength(8);
      expect(new Set(row.split("")).size).toBe(8);
      row.split("").forEach((c) => expect(ALL_GROUPS).toContain(c));
    });
  });

  it("covers all C(12,8) = 495 possible 8-group combinations exactly once", () => {
    const expectedCombos = new Set(
      combinations(ALL_GROUPS, 8).map((c) => c.sort().join(""))
    );
    const actualCombos = THIRD_PLACE_COMBINATIONS.map((row) =>
      row.split("").sort().join("")
    );

    expect(new Set(actualCombos).size).toBe(495);
    actualCombos.forEach((combo) => expect(expectedCombos.has(combo)).toBe(true));
  });
});

describe("resolveThirdPlaceOpponents", () => {
  it("resolves a known combination to the exact row from the regulations", () => {
    // Row 1: "EJIFHGLK" for groups E,F,G,H,I,J,K,L qualifying
    const resolved = resolveThirdPlaceOpponents(["E", "F", "G", "H", "I", "J", "K", "L"]);

    expect(resolved).toEqual({
      "1A": "E",
      "1B": "J",
      "1D": "I",
      "1E": "F",
      "1G": "H",
      "1I": "G",
      "1K": "L",
      "1L": "K",
    });
  });

  it("is order-independent on the input groups", () => {
    const a = resolveThirdPlaceOpponents(["E", "F", "G", "H", "I", "J", "K", "L"]);
    const b = resolveThirdPlaceOpponents(["L", "K", "J", "I", "H", "G", "F", "E"]);
    expect(a).toEqual(b);
  });

  it("returns every required match slot", () => {
    const resolved = resolveThirdPlaceOpponents(["E", "F", "G", "H", "I", "J", "K", "L"]);
    THIRD_PLACE_MATCH_SLOTS.forEach((slot) => {
      expect(resolved?.[slot]).toBeTruthy();
    });
  });

  it("returns null for a combination that isn't a valid set of 8 groups", () => {
    expect(resolveThirdPlaceOpponents(["A", "B", "C"])).toBeNull();
  });

  it("resolves the last row of the table (groups A-H qualifying)", () => {
    const resolved = resolveThirdPlaceOpponents(["A", "B", "C", "D", "E", "F", "G", "H"]);
    expect(resolved).toEqual({
      "1A": "H",
      "1B": "G",
      "1D": "B",
      "1E": "C",
      "1G": "A",
      "1I": "F",
      "1K": "D",
      "1L": "E",
    });
  });
});
