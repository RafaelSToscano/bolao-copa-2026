import { useMemo } from "react";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { TeamStanding, QualifiedTeam } from "@/types/standings";
import {
  calculateGroupStandings,
  calculateAllGroupStandings,
  calculateBestThirdPlace,
  calculateQualifiedTeams as calcQualifiedTeams,
} from "@/services/standings/standingsCalculations";

export function useStandings(games: Game[], predictions: Prediction[]) {
  const allGroupStandings = useMemo(
    () => calculateAllGroupStandings(games),
    [games]
  );

  const bestThirdPlace = useMemo(
    () => calculateBestThirdPlace(games),
    [games]
  );

  const qualifiedTeams = useMemo(
    () => calcQualifiedTeams(games),
    [games]
  );

  return {
    allGroupStandings,
    bestThirdPlace,
    qualifiedTeams,
  };
}
