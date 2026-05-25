import { useMemo } from "react";
import { Game } from "@/types/game";
import { KnockoutMatch } from "@/types/knockout";
import { generateRound32 } from "@/services/standings/knockoutQualification";

export function useKnockout(games: Game[]) {
  const round32 = useMemo(() => generateRound32(games), [games]);

  return {
    round32,
  };
}
