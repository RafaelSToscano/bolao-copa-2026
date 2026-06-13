"use client";

import { useAppShell } from "@/components/layouts/AppShell";
import { CrowdPredictionsSection } from "@/components/sections/CrowdPredictionsSection";

export default function PalpitesDaGaleraPage() {
  const { currentUser, games, predictions, players, ranking } = useAppShell();
  return (
    <CrowdPredictionsSection
      games={games}
      predictions={predictions}
      players={players}
      currentUserId={currentUser.id}
      ranking={ranking}
    />
  );
}
