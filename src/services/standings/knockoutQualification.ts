import { Game } from "@/types/game";
import { KnockoutMatch, QualifiedTeam } from "@/types/knockout";
import {
  calculateBestThirdPlace,
  calculateQualifiedTeams,
} from "./standingsCalculations";
import {
  resolveThirdPlaceOpponents,
  ThirdPlaceMatchSlot,
} from "./thirdPlaceCombinations";

type WinnerSlot = { kind: "winner"; group: string };
type RunnerUpSlot = { kind: "runnerUp"; group: string };
type ThirdSlot = { kind: "third"; matchSlot: ThirdPlaceMatchSlot };
type Slot = WinnerSlot | RunnerUpSlot | ThirdSlot;

// Official round-of-32 bracket, "Regulations for the FIFA World Cup 26",
// article 12.6 (matches M73-M88, in that exact order). `third` slots
// reference the match-slot key used to resolve which group's 3rd-place
// team is the actual opponent, via Annexe C — see thirdPlaceCombinations.ts.
const BRACKET: ReadonlyArray<{ home: Slot; away: Slot }> = [
  { home: { kind: "runnerUp", group: "A" }, away: { kind: "runnerUp", group: "B" } },
  { home: { kind: "winner", group: "E" }, away: { kind: "third", matchSlot: "1E" } },
  { home: { kind: "winner", group: "F" }, away: { kind: "runnerUp", group: "C" } },
  { home: { kind: "winner", group: "C" }, away: { kind: "runnerUp", group: "F" } },
  { home: { kind: "winner", group: "I" }, away: { kind: "third", matchSlot: "1I" } },
  { home: { kind: "runnerUp", group: "E" }, away: { kind: "runnerUp", group: "I" } },
  { home: { kind: "winner", group: "A" }, away: { kind: "third", matchSlot: "1A" } },
  { home: { kind: "winner", group: "L" }, away: { kind: "third", matchSlot: "1L" } },
  { home: { kind: "winner", group: "D" }, away: { kind: "third", matchSlot: "1D" } },
  { home: { kind: "winner", group: "G" }, away: { kind: "third", matchSlot: "1G" } },
  { home: { kind: "runnerUp", group: "K" }, away: { kind: "runnerUp", group: "L" } },
  { home: { kind: "winner", group: "H" }, away: { kind: "runnerUp", group: "J" } },
  { home: { kind: "winner", group: "B" }, away: { kind: "third", matchSlot: "1B" } },
  { home: { kind: "winner", group: "J" }, away: { kind: "runnerUp", group: "H" } },
  { home: { kind: "winner", group: "K" }, away: { kind: "third", matchSlot: "1K" } },
  { home: { kind: "runnerUp", group: "D" }, away: { kind: "runnerUp", group: "G" } },
];

export function generateRound32(games: Game[]): KnockoutMatch[] {
  const qualified = calculateQualifiedTeams(games);
  const bestThirds = calculateBestThirdPlace(games).slice(0, 8) as Array<
    QualifiedTeam & { group: string }
  >;

  // Annexe C only resolves cleanly once exactly 8 groups have a qualifying
  // third; with fewer (e.g. group stage still in progress) we leave those
  // slots undefined rather than guess.
  const thirdPlaceOpponents =
    bestThirds.length === 8
      ? resolveThirdPlaceOpponents(bestThirds.map((t) => t.group))
      : null;

  function findTeam(position: "1" | "2", group: string): QualifiedTeam | undefined {
    return qualified.find(
      (t) => t.position === position && t.group === group
    ) as QualifiedTeam | undefined;
  }

  function findThird(matchSlot: ThirdPlaceMatchSlot): QualifiedTeam | undefined {
    const sourceGroup = thirdPlaceOpponents?.[matchSlot];
    if (!sourceGroup) return undefined;

    const third = bestThirds.find((t) => t.group === sourceGroup);
    if (!third) return undefined;

    return { ...third, position: "3" } as QualifiedTeam;
  }

  function resolve(slot: Slot): QualifiedTeam | undefined {
    if (slot.kind === "winner") return findTeam("1", slot.group);
    if (slot.kind === "runnerUp") return findTeam("2", slot.group);
    return findThird(slot.matchSlot);
  }

  return BRACKET.map(({ home, away }) => ({
    home: resolve(home),
    away: resolve(away),
  }));
}
