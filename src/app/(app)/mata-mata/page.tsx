"use client";

import { useAppShell } from "@/components/layouts/AppShell";
import { KnockoutSection } from "@/components/sections/KnockoutSection";

export default function MataMataPage() {
  const { currentUser, games, predictions, round32, qualifiedTeams } =
    useAppShell();

  return (
    <KnockoutSection
      games={games}
      predictions={predictions}
      round32={round32}
      qualifiedTeams={qualifiedTeams}
      currentUserId={currentUser.id}
    />
  );
}
