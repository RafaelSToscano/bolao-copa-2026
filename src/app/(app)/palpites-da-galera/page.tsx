"use client";

import { useAppShell } from "@/components/layouts/AppShell";
import { CrowdPredictionsSection } from "@/components/sections/CrowdPredictionsSection";

export default function PalpitesDaGaleraPage() {
  const {
    currentUser,
    games,
    predictions,
    knockoutMatches,
    knockoutPredictions,
    players,
    ranking,
    suspenseMode,
  } = useAppShell();
  return (
    <CrowdPredictionsSection
      games={games}
      predictions={predictions}
      knockoutMatches={knockoutMatches}
      knockoutPredictions={knockoutPredictions}
      players={players}
      currentUserId={currentUser.id}
      ranking={ranking}
      suspenseMode={suspenseMode && !currentUser.is_admin}
    />
  );
}
