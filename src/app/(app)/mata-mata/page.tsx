"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Flag } from "@/components/ui/Flag";
import { KnockoutMatchRecord } from "@/types/knockout";
import { slotLabel } from "@/lib/knockoutSlotLabel";
import { ROUND_LABELS, ROUND_ORDER } from "@/lib/knockoutRounds";
import { useKnockoutResults } from "@/hooks/useKnockoutResults";

function ResultMatchCard({ match }: { match: KnockoutMatchRecord }) {
  const { official_score_home: scoreHome, official_score_away: scoreAway } = match;
  const hasScore = scoreHome !== null && scoreAway !== null;
  const winner = !hasScore ? null : scoreHome > scoreAway ? "home" : scoreHome < scoreAway ? "away" : null;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-1.5 bg-slate-800/50 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
          Jogo {match.id}
        </span>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 leading-none mb-1">
              {slotLabel(match.home_slot)}
            </div>
            {match.home_team && (
              <div className="mb-1">
                <Flag team={match.home_team} size="small" />
              </div>
            )}
            <span
              className={`block font-bold text-sm truncate ${winner === "home" ? "text-yellow-400" : ""}`}
            >
              {match.home_team ?? "---"}
            </span>
          </div>

          <div className="shrink-0 px-2 text-center font-black text-base text-white">
            {hasScore ? `${scoreHome} x ${scoreAway}` : "x"}
          </div>

          <div className="flex-1 min-w-0 text-right">
            <div className="text-xs text-slate-500 leading-none mb-1">
              {slotLabel(match.away_slot)}
            </div>
            {match.away_team && (
              <div className="mb-1">
                <Flag team={match.away_team} size="small" />
              </div>
            )}
            <span
              className={`block font-bold text-sm truncate ${winner === "away" ? "text-yellow-400" : ""}`}
            >
              {match.away_team ?? "---"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MataMataPage() {
  const { matches, isLoading } = useKnockoutResults();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black">Mata-mata</h2>
        <p className="text-slate-400 text-sm">
          Acompanhe os resultados oficiais da fase eliminatória.
        </p>
      </div>

      {isLoading ? (
        <p className="text-slate-500 text-sm">Carregando jogos...</p>
      ) : (
        ROUND_ORDER.map((round) => {
          const roundMatches = matches
            .filter((m) => m.round === round)
            .sort((a, b) => a.match_number - b.match_number);

          if (roundMatches.length === 0) return null;

          return (
            <Card key={round} className="bg-slate-900 border-slate-800 text-white rounded-3xl">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-base font-black text-yellow-400 uppercase tracking-wide">
                  {ROUND_LABELS[round]}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roundMatches.map((match) => (
                    <ResultMatchCard key={match.id} match={match} />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
