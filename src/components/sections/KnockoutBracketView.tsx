"use client";

import { Flag } from "@/components/ui/Flag";
import { ROUND_LABELS, ROUND_ORDER } from "@/lib/knockoutRounds";
import { formatDate } from "@/lib/formatting";
import { DisplayKnockoutMatch } from "@/lib/knockoutDisplayMatches";
import { KnockoutRound } from "@/types/knockout";
import { Shield } from "lucide-react";

type Props = {
  matches: DisplayKnockoutMatch[];
};

const ROUND_STYLE: Record<
  KnockoutRound,
  { title: string; gap: string; top: string }
> = {
  r32: { title: "16 avos", gap: "gap-4", top: "pt-0" },
  r16: { title: "Oitavas", gap: "gap-20", top: "pt-16" },
  qf: { title: "Quartas", gap: "gap-44", top: "pt-40" },
  sf: { title: "Semifinais", gap: "gap-72", top: "pt-72" },
  third_place: { title: "3º lugar", gap: "gap-6", top: "pt-32" },
  final: { title: "Final", gap: "gap-6", top: "pt-80" },
};

function TeamRow({
  team,
  isWinner,
}: {
  team: string | null;
  isWinner: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-2 py-1.5 ${
        isWinner ? "bg-yellow-400/15 text-yellow-300" : "text-white"
      }`}
    >
      {team ? (
        <Flag team={team} size="small" />
      ) : (
        <Shield size={17} className="text-slate-500" />
      )}

      <span className="truncate text-sm font-bold">{team ?? "A definir"}</span>
    </div>
  );
}

function MatchCard({
  match,
  showLeftConnector,
  showRightConnector,
}: {
  match: DisplayKnockoutMatch;
  showLeftConnector: boolean;
  showRightConnector: boolean;
}) {
  const homeTeam = match.display_home_team;
  const awayTeam = match.display_away_team;

  const hasScore =
    match.official_score_home !== null && match.official_score_away !== null;

  const homeWinner = match.winner_team !== null && match.winner_team === homeTeam;
  const awayWinner = match.winner_team !== null && match.winner_team === awayTeam;

  return (
    <div className="relative w-56 shrink-0">
      {showLeftConnector && (
        <div className="absolute -left-6 top-1/2 h-px w-6 bg-slate-700" />
      )}

      {showRightConnector && (
        <>
          <div className="absolute -right-6 top-1/2 h-px w-6 bg-slate-700" />
          <div className="absolute -right-6 top-1/2 h-20 w-px -translate-y-1/2 bg-slate-700" />
        </>
      )}

      <div className="rounded-2xl border border-slate-700/80 bg-slate-950/95 p-3 shadow-xl shadow-black/20">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold text-slate-400">
            {formatDate(match.match_date)}
          </p>

          <span className="shrink-0 rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs font-black text-slate-300">
            {hasScore
              ? `${match.official_score_home} x ${match.official_score_away}`
              : "x"}
          </span>
        </div>

        <div className="space-y-1">
          <TeamRow team={homeTeam} isWinner={homeWinner} />
          <TeamRow team={awayTeam} isWinner={awayWinner} />
        </div>
      </div>
    </div>
  );
}

export function KnockoutBracketView({ matches }: Props) {
  const matchesByRound = ROUND_ORDER.map((round) => ({
    round,
    matches: matches
      .filter((match) => match.round === round)
      .sort((a, b) => a.match_number - b.match_number),
  }));

  return (
    <div className="-mx-4 overflow-x-auto pb-6 md:mx-0">
      <div className="min-w-[1480px] px-4 md:px-1">
        <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-xs font-bold text-slate-300 md:hidden">
          Arraste para o lado para ver todo o chaveamento →
        </div>

        <div className="flex gap-12">
          {matchesByRound.map(({ round, matches: roundMatches }, index) => {
            const style = ROUND_STYLE[round];

            return (
              <section key={round} className="w-56 shrink-0">
                <h3 className="mb-5 text-center text-sm font-black uppercase tracking-wide text-yellow-400">
                  {style.title || ROUND_LABELS[round]}
                </h3>

                <div className={`flex flex-col ${style.top} ${style.gap}`}>
                  {roundMatches.length > 0 ? (
                    roundMatches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        showLeftConnector={index > 0}
                        showRightConnector={index < matchesByRound.length - 1}
                      />
                    ))
                  ) : (
                    <div className="w-56 rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">
                      A definir
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
