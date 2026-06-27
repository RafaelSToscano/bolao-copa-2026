"use client";

import { useAppShell } from "@/components/layouts/AppShell";
import { SimulationSection } from "@/components/sections/SimulationSection";

export default function SimuladorPage() {
  const { games, players, predictions, knockoutMatches, knockoutPredictions } =
    useAppShell();
  return (
    <SimulationSection
      games={games}
      players={players}
      predictions={predictions}
      knockoutMatches={knockoutMatches}
      knockoutPredictions={knockoutPredictions}
    />
  );
}
