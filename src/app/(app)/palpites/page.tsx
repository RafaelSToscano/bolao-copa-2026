"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppShell } from "@/components/layouts/AppShell";
import { PredictionsSection } from "@/components/sections/PredictionsSection";

function PalpitesPageContent() {
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");
  const {
    currentUser,
    games,
    predictions,
    drafts,
    setDrafts,
    saveSinglePrediction,
    groupsLocked,
    handleApplyRandomPredictions,
    handleApplySingleRandomPrediction,
    handleClearPredictions,
    stats,
  } = useAppShell();

  useEffect(() => {
    if (focus !== "group-predictions") return;
    const id = window.setTimeout(() => {
      document
        .getElementById("group-predictions")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 150);
    return () => window.clearTimeout(id);
  }, [focus]);

  return (
    <PredictionsSection
      games={games}
      predictions={predictions}
      drafts={drafts}
      groupsLocked={groupsLocked}
      currentUserId={currentUser.id}
      onDraftChange={(gameId, scores) => {
        setDrafts((prev) => ({
          ...prev,
          [gameId]: scores,
        }));
      }}
      onSinglePrediction={saveSinglePrediction}
      onRandomPredictions={handleApplyRandomPredictions}
      onSingleRandomPrediction={handleApplySingleRandomPrediction}
      onClearPredictions={handleClearPredictions}
      userStats={{
        totalUserGames: stats.totalUserGames,
        userPredictedGames: stats.userPredictedGames,
        userPendingGames: stats.userPendingGames,
        userCompletion: stats.userCompletion,
      }}
    />
  );
}

export default function PalpitesPage() {
  return (
    <Suspense fallback={null}>
      <PalpitesPageContent />
    </Suspense>
  );
}
