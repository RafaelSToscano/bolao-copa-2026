"use client";

import { useAppShell } from "@/components/layouts/AppShell";
import { StandingsSection } from "@/components/sections/StandingsSection";
import { calculateGroupStandingsFromPredictions } from "@/services/standings/predictionSimulation";

export default function ClassificacaoPage() {
  const {
    currentUser,
    games,
    predictions,
    allGroupStandings,
    bestThirdPlace,
  } = useAppShell();

  if (games.length === 0) return null;

  return (
    <StandingsSection
      games={games}
      predictions={predictions}
      allGroupStandings={allGroupStandings}
      bestThirdPlace={bestThirdPlace}
      calculateGroupStandingsFromPredictions={
        calculateGroupStandingsFromPredictions
      }
      currentUserId={currentUser.id}
    />
  );
}
