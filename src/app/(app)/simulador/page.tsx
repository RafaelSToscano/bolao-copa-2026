"use client";

import { useAppShell } from "@/components/layouts/AppShell";
import { SimulationSection } from "@/components/sections/SimulationSection";

export default function SimuladorPage() {
  const { games, players, predictions } = useAppShell();
  return (
    <SimulationSection
      games={games}
      players={players}
      predictions={predictions}
    />
  );
}
