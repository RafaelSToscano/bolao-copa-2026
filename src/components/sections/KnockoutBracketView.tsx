"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Flag } from "@/components/ui/Flag";
import { ROUND_LABELS, ROUND_ORDER } from "@/lib/knockoutRounds";
import { formatDate } from "@/lib/formatting";
import { DisplayKnockoutMatch } from "@/lib/knockoutDisplayMatches";
import { KnockoutRound } from "@/types/knockout";
import { Shield } from "lucide-react";

type Props = {
  matches: DisplayKnockoutMatch[];
};

const DESKTOP_ROUND_STYLE: Record<
  KnockoutRound,
  { paddingTop: string; gap: string; title: string }
> = {
  r32: { paddingTop: "pt-0", gap: "gap-4", title: "16 avos" },
  r16: { paddingTop: "pt-16", gap: "gap-20", title: "Oitavas" },
  qf: { paddingTop: "pt-40", gap: "gap-44", title: "Quartas" },
  sf: { paddingTop: "pt-72", gap: "gap-72", title: "Semifinais" },
  third_place: { paddingTop: "pt-32", gap: "gap-6", title: "3º lugar" },
  final: { paddingTop: "pt-80", gap: "gap-6", title: "Final" },
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
        isWinner ? "bg-yellow-400/15 text-yellow-300" : "text-slate-100"
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

function BracketMatchCard({
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
    <div className="relative">
      {showLeftConnector && (
        <div className="absolute -left-6 top-1/2 hidden h-px w-6 bg-slate-700 lg:block" />
      )}

      {showRightConnector && (
        <>
          <div className="absolute -right-6 top-1/2 hidden h-px w-6 bg-slate-700 lg:block" />
          <div className="absolute -right-6 top-1/2 hidden h-20 w-px -translate-y-1/2 bg-slate-700 lg:block" />
        </>
      )}

      <div className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/95 p-3 shadow-xl shadow-black/20">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold text-slate-400">
            {formatDate(match.match_date)}
          </p>

          <div className="shrink-0 rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs font-black text-slate-300">
            {hasScore
              ? `${match.official_score_home} x ${match.official_score_away}`
              : "x"}
          </div>
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
    <>
      <div className="space-y-5 lg:hidden">
        {matchesByRound.map(({ round, matches: roundMatches }) => (
          <Card
            key={round}
            className="rounded-3xl border-slate-800 bg-slate-900/80 text-white"
          >
            <CardContent className="space-y-4 p-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide text-yellow-400">
                  {ROUND_LABELS[round]}
                </h3>
                <p className="text-xs text-slate-500">
                  {roundMatches.length
                    ? `${roundMatches.length} confronto(s)`
                    : "A definir"}
                </p>
              </div>

              <div className="space-y-3">
                {roundMatches.length > 0 ? (
                  roundMatches.map((match) => (
                    <BracketMatchCard
                      key={match.id}
                      match={match}
                      showLeftConnector={false}
                      showRightConnector={false}
                    />
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">
                    A definir
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="hidden overflow-x-auto pb-6 lg:block">
        <div className="flex min-w-[1480px] gap-12">
          {matchesByRound.map(({ round, matches: roundMatches }, index) => {
            const style = DESKTOP_ROUND_STYLE[round];

            return (
              <section key={round} className="w-56 shrink-0">
                <h3 className="mb-5 text-center text-sm font-black uppercase tracking-wide text-yellow-400">
                  {style.title}
                </h3>

                <div className={`flex flex-col ${style.paddingTop} ${style.gap}`}>
                  {roundMatches.length > 0 ? (
                    roundMatches.map((match) => (
                      <BracketMatchCard
                        key={match.id}
                        match={match}
                        showLeftConnector={index > 0}
                        showRightConnector={index < matchesByRound.length - 1}
                      />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">
                      A definir
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}