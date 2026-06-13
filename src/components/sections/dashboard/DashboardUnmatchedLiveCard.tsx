"use client";

import { LiveScoreMatch } from "@/hooks/useLiveScores";
import { Flag } from "@/components/ui/Flag";
import { LivePill } from "./LivePill";

interface DashboardUnmatchedLiveCardProps {
  match: LiveScoreMatch;
}

/**
 * Slim live card for upstream IN_PLAY rows that don't join to a local
 * `Game` (team-name mismatch, missing DB seed). Renders score + teams
 * straight from the football-data payload — no prediction, no points,
 * no mock-bump — so the viewer at least sees the live score even when
 * the rest of the app can't fold it into ranking/my-status.
 */
export function DashboardUnmatchedLiveCard({
  match,
}: DashboardUnmatchedLiveCardProps) {
  const hasScore = match.homeScore != null && match.awayScore != null;

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-5 overflow-hidden border border-amber-500/30 shadow-[0_0_24px_rgba(245,158,11,0.12)]">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

      <div className="flex items-start justify-between gap-2 mb-4">
        <LivePill />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <TeamColumn team={match.homeTeam} />

        <div className="flex flex-col items-center gap-2">
          {hasScore ? (
            <div className="flex items-center gap-3">
              <span className="text-5xl font-black text-red-300 tabular-nums">
                {match.homeScore}
              </span>
              <span className="text-3xl font-black text-slate-500">×</span>
              <span className="text-5xl font-black text-red-300 tabular-nums">
                {match.awayScore}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-slate-600">
              <span className="text-5xl font-black tabular-nums">—</span>
              <span className="text-3xl font-black">×</span>
              <span className="text-5xl font-black tabular-nums">—</span>
            </div>
          )}
        </div>

        <TeamColumn team={match.awayTeam} />
      </div>
    </div>
  );
}

function TeamColumn({ team }: { team: string }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <span className="inline-flex [&>img]:!mr-0">
        <Flag team={team} size="large" />
      </span>
      <span className="text-base font-black text-white text-center leading-tight">
        {team}
      </span>
    </div>
  );
}
