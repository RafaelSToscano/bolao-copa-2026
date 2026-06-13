"use client";

import { useAppShell } from "@/components/layouts/AppShell";
import { RankingSection } from "@/components/sections/RankingSection";

export default function RankingPage() {
  const { ranking, positionChanges } = useAppShell();
  return <RankingSection ranking={ranking} positionChanges={positionChanges} />;
}
