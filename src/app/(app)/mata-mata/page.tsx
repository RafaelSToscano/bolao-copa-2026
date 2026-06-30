"use client";

import { KnockoutBracketView } from "@/components/sections/KnockoutBracketView";
import { useAppShell } from "@/components/layouts/AppShell";
import {
  attachMyKnockoutPredictions,
  buildDisplayKnockoutMatches,
} from "@/lib/knockoutDisplayMatches";

export default function MataMataPage() {
  const { games, knockoutMatches, knockoutPredictions, currentUser } =
    useAppShell();

  const myPredictions = knockoutPredictions.filter(
    (p) => p.player_id === currentUser.id
  );
  const displayMatches = attachMyKnockoutPredictions(
    buildDisplayKnockoutMatches(knockoutMatches, games),
    myPredictions
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 px-4 py-3 shadow-xl">
        <h2 className="text-xl font-black tracking-tight">Mata-mata</h2>
        <p className="text-sm text-slate-400">
          Chaveamento da fase eliminatória.
        </p>
      </div>

      <KnockoutBracketView matches={displayMatches} />
    </div>
  );
}
