"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Flag } from "@/components/ui/Flag";
import { KnockoutMatchRecord } from "@/types/knockout";
import { slotLabel } from "@/lib/knockoutSlotLabel";
import { ROUND_LABELS, ROUND_ORDER } from "@/lib/knockoutRounds";
import { formatDate } from "@/lib/formatting";
import { useKnockoutResults } from "@/hooks/useKnockoutResults";

function BracketTeamRow({
  team,
  slot,
  isWinner,
}: {
  team: string | null;
  slot: string;
  isWinner: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 ${
        isWinner ? "bg-yellow-400/10 text-yellow-300" : "bg-slate-900/70 text-white"
      }`}
    >
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-slate-500">
          {slotLabel(slot)}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          {team && <Flag team={team} size="small" />}
          <span className="truncate text-sm font-black">
            {team ?? "A definir"}
          </span>
        </div>
      </div>
    </div>
  );
}

function BracketMatchCard({ match }: { match: KnockoutMatchRecord }) {
  const hasScore =
    match.official_score_home !== null && match.official_score_away !== null;
  const homeWinner = match.winner_team !== null && match.winner_team === match.home_team;
  const awayWinner = match.winner_team !== null && match.winner_team === match.away_team;

  return (
    <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-xl">
      <div className="absolute -left-3 top-1/2 hidden h-px w-3 bg-slate-700 lg:block" />
      <div className="absolute -right-3 top-1/2 hidden h-px w-3 bg-slate-700 lg:block" />

      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-wide text-yellow-400">
            Jogo {match.match_number}
          </div>
          <div className="text-xs text-slate-500">{formatDate(match.match_date)}</div>
        </div>
        <div className="rounded-full border border-slate-800 px-2 py-1 text-xs font-black text-slate-300">
          {hasScore ? `${match.official_score_home} x ${match.official_score_away}` : "x"}
        </div>
      </div>

      <div className="space-y-2">
        <BracketTeamRow
          team={match.home_team}
          slot={match.home_slot}
          isWinner={homeWinner}
        />
        <BracketTeamRow
          team={match.away_team}
          slot={match.away_slot}
          isWinner={awayWinner}
        />
      </div>
    </div>
  );
}

export default function MataMataPage() {
  const { matches, isLoading } = useKnockoutResults();

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl">
        <h2 className="text-3xl font-black tracking-tight">Mata-mata</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Chaveamento oficial da fase eliminatória. Esta tela é apenas visual:
          os palpites dos 16 avos ficam na aba Palpites.
        </p>
      </div>

      {isLoading ? (
        <p className="text-slate-500 text-sm">Carregando chaveamento...</p>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="grid min-w-[1120px] grid-cols-6 gap-6">
            {ROUND_ORDER.map((round) => {
              const roundMatches = matches
                .filter((m) => m.round === round)
                .sort((a, b) => a.match_number - b.match_number);

              return (
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

                    <div className="space-y-4">
                      {roundMatches.length > 0 ? (
                        roundMatches.map((match) => (
                          <BracketMatchCard key={match.id} match={match} />
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-800 p-4 text-sm text-slate-500">
                          A definir
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
