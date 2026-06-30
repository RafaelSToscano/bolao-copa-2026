"use client";

import { useAppShell } from "@/components/layouts/AppShell";
import { HistoricoSection } from "@/components/sections/HistoricoSection";

export default function HistoricoPage() {
  const {
    ranking,
    games,
    predictions,
    knockoutMatches,
    knockoutPredictions,
    currentUser,
  } = useAppShell();

  return (
    <HistoricoSection
      ranking={ranking}
      games={games}
      predictions={predictions}
      knockoutMatches={knockoutMatches}
      knockoutPredictions={knockoutPredictions}
      currentUserId={currentUser?.id}
    />
  );
}
