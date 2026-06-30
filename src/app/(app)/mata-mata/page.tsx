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
      <div className="rounded-[28px] border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-2xl md:p-6">
        <h2 className="text-2xl font-black tracking-tight md:text-3xl">
          Mata-mata
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Chaveamento da fase eliminatória. Os confrontos avançam conforme os
          classificados e vencedores forem definidos.
        </p>
      </div>

      <KnockoutBracketView matches={displayMatches} />
    </div>
  );
}
