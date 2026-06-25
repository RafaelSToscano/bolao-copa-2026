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
    players,
    ranking,
    handleUpdateOfficialResult,
    handleApprovePlayer,
    handleRejectPlayer,
    predictionsEnabled,
    handleSetPredictionsEnabled,
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
      players={players}
      ranking={ranking}
      onUpdateResult={handleUpdateOfficialResult}
      onApprovePlayer={handleApprovePlayer}
      onRejectPlayer={handleRejectPlayer}
      predictionsEnabled={predictionsEnabled}
      onTogglePredictions={handleSetPredictionsEnabled}
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
