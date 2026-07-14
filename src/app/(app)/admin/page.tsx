"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppShell } from "@/components/layouts/AppShell";
import { AdminSection } from "@/components/sections/AdminSection";

export default function AdminPage() {
  const router = useRouter();

  const {
    currentUser,
    games,
    predictions,
    knockoutMatches,
    knockoutPredictions,
    players,
    ranking,
    tournamentResult,
    handleUpdateOfficialResult,
    handleUpdateKnockoutOfficialResult,
    handleUpdateTournamentResult,
    handleApprovePlayer,
    handleRejectPlayer,
    stats,
  } = useAppShell();

  useEffect(() => {
    if (!currentUser.is_admin) {
      router.replace("/");
    }
  }, [currentUser.is_admin, router]);

  if (!currentUser.is_admin) return null;

  return (
    <AdminSection
      games={games}
      predictions={predictions}
      knockoutMatches={knockoutMatches}
      knockoutPredictions={knockoutPredictions}
      players={players}
      ranking={ranking}
      tournamentResult={tournamentResult}
      onUpdateResult={handleUpdateOfficialResult}
      onUpdateKnockoutResult={handleUpdateKnockoutOfficialResult}
      onUpdateTournamentResult={handleUpdateTournamentResult}
      onApprovePlayer={handleApprovePlayer}
      onRejectPlayer={handleRejectPlayer}
      stats={{
        totalPlayers: stats.totalPlayers,
        approvedPlayers: stats.approvedPlayers,
        pendingPlayers: stats.pendingPlayers,
        activePlayers: stats.activePlayers,
        incompletePlayers: stats.incompletePlayers,
        zeroPlayers: stats.zeroPlayers,
      }}
    />
  );
}