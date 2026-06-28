"use client";

import { useRouter } from "next/navigation";
import { useAppShell } from "@/components/layouts/AppShell";
import { DashboardSection } from "@/components/sections/DashboardSection";

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, predictions, knockoutPredictions, games } = useAppShell();

  return (
    <DashboardSection
      currentUserId={currentUser.id}
      myPredictions={predictions}
      knockoutPredictions={knockoutPredictions}
      games={games}
      onNavigate={(href) => router.push(href)}
    />
  );
}
