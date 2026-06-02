import { Game } from "@/types/game";
import { KnockoutMatch, QualifiedTeam } from "@/types/knockout";
import {
  calculateBestThirdPlace,
  calculateQualifiedTeams,
} from "../standings/standingsCalculations";

export function generateRound32(games: Game[]): KnockoutMatch[] {
  const qualified = calculateQualifiedTeams(games);
  const bestThirds = calculateBestThirdPlace(games).slice(0, 8);

  function findTeam(position: "1" | "2", group: string): QualifiedTeam | undefined {
    return qualified.find(
      (t) => t.position === position && t.group === group
    ) as QualifiedTeam | undefined;
  }

  function findThird(index: number): QualifiedTeam | undefined {
    const third = bestThirds[index] as (QualifiedTeam | undefined);
    if (!third) return undefined;

    return {
      ...third,
      position: "3",
      group: (third as any).group,
    } as QualifiedTeam;
  }

  return [
    { home: findTeam("1", "A"), away: findThird(7) },
    { home: findTeam("1", "B"), away: findThird(6) },
    { home: findTeam("1", "C"), away: findTeam("2", "F") },
    { home: findTeam("1", "D"), away: findThird(5) },
    { home: findTeam("1", "E"), away: findThird(4) },
    { home: findTeam("1", "F"), away: findTeam("2", "C") },
    { home: findTeam("1", "G"), away: findThird(3) },
    { home: findTeam("1", "H"), away: findTeam("2", "I") },
    { home: findTeam("1", "I"), away: findThird(2) },
    { home: findTeam("1", "J"), away: findTeam("2", "K") },
    { home: findTeam("1", "K"), away: findThird(1) },
    { home: findTeam("1", "L"), away: findTeam("2", "J") },
    { home: findTeam("2", "A"), away: findTeam("2", "B") },
    { home: findTeam("2", "D"), away: findTeam("2", "E") },
    { home: findTeam("2", "G"), away: findTeam("2", "H") },
    { home: findTeam("2", "L"), away: findThird(0) },
  ];
}
