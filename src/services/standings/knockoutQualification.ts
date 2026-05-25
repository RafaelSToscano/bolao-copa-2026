import { Game } from "@/types/game";
import { KnockoutMatch, QualifiedTeam } from "@/types/knockout";
import { calculateQualifiedTeams } from "../standings/standingsCalculations";

/**
 * Generates the Round of 32 knockout bracket
 * @param games - All games (should include group phase games)
 * @returns Array of matches for Round of 32
 */
export function generateRound32(games: Game[]): KnockoutMatch[] {
  const qualified = calculateQualifiedTeams(games);

  function findTeam(position: "1" | "2", group: string): QualifiedTeam | undefined {
    return qualified.find((t) => t.position === position && t.group === group) as QualifiedTeam | undefined;
  }

  return [
    { home: findTeam("1", "A"), away: findTeam("2", "B") },
    { home: findTeam("1", "B"), away: findTeam("2", "A") },
    { home: findTeam("1", "C"), away: findTeam("2", "D") },
    { home: findTeam("1", "D"), away: findTeam("2", "C") },
    { home: findTeam("1", "E"), away: findTeam("2", "F") },
    { home: findTeam("1", "F"), away: findTeam("2", "E") },
    { home: findTeam("1", "G"), away: findTeam("2", "H") },
    { home: findTeam("1", "H"), away: findTeam("2", "G") },
  ];
}
