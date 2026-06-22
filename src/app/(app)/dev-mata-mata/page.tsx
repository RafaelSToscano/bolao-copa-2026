"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppShell } from "@/components/layouts/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Flag } from "@/components/ui/Flag";
import { KnockoutMatchRecord, DraftKnockoutPrediction } from "@/types/knockout";
import { DEV_MATA_MATA_ALLOWED } from "@/lib/devAccess";
import { slotLabel } from "@/lib/knockoutSlotLabel";
import { useKnockoutPredictions } from "@/hooks/useKnockoutPredictions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BRACKET_GROUPS = [
  { label: "Chave A", range: [0, 4] as [number, number] },
  { label: "Chave B", range: [4, 8] as [number, number] },
  { label: "Chave C", range: [8, 12] as [number, number] },
  { label: "Chave D", range: [12, 16] as [number, number] },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MatchCard({
  match,
  draft,
  locked,
  onChange,
}: {
  match: KnockoutMatchRecord;
  draft: DraftKnockoutPrediction;
  locked: boolean;
  onChange: (next: DraftKnockoutPrediction) => void;
}) {
  const scoreHome = draft.predicted_score_home;
  const scoreAway = draft.predicted_score_away;
  const winner = draft.predicted_winner;
  const teamsKnown = Boolean(match.home_team && match.away_team);
  const readOnly = locked || !teamsKnown;

  const isDraw =
    scoreHome !== "" && scoreAway !== "" && scoreHome === scoreAway;

  const impliedWinner: "home" | "away" | null =
    scoreHome !== "" && scoreAway !== "" && scoreHome !== scoreAway
      ? Number(scoreHome) > Number(scoreAway)
        ? "home"
        : "away"
      : null;

  const effectiveWinner = impliedWinner ?? (isDraw ? winner : null);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Card header */}
      <div className="px-4 py-1.5 bg-slate-800/50 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
          Jogo {match.match_number}
        </span>
        <span className="text-xs text-slate-600">1ª Fase Eliminatória</span>
      </div>

      {/* Teams + score inputs */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Home */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 leading-none mb-1">
              {slotLabel(match.home_slot)}
            </div>
            <div className="flex items-center gap-1.5">
              {match.home_team && <Flag team={match.home_team} size="small" />}
              <span
                className={`font-bold text-sm truncate ${effectiveWinner === "home" ? "text-yellow-400" : ""}`}
              >
                {match.home_team ?? "---"}
              </span>
            </div>
          </div>

          {/* Score inputs */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Input
              type="number"
              min="0"
              disabled={readOnly}
              value={scoreHome}
              onChange={(e) =>
                onChange({ ...draft, predicted_score_home: e.target.value })
              }
              className="h-10 w-11 rounded-xl bg-slate-900 border-slate-700 text-center text-base font-black text-white p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-slate-500 font-black text-sm">x</span>
            <Input
              type="number"
              min="0"
              disabled={readOnly}
              value={scoreAway}
              onChange={(e) =>
                onChange({ ...draft, predicted_score_away: e.target.value })
              }
              className="h-10 w-11 rounded-xl bg-slate-900 border-slate-700 text-center text-base font-black text-white p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* Away */}
          <div className="flex-1 min-w-0 text-right">
            <div className="text-xs text-slate-500 leading-none mb-1">
              {slotLabel(match.away_slot)}
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <span
                className={`font-bold text-sm truncate ${effectiveWinner === "away" ? "text-yellow-400" : ""}`}
              >
                {match.away_team ?? "---"}
              </span>
              {match.away_team && <Flag team={match.away_team} size="small" />}
            </div>
          </div>
        </div>
      </div>

      {/* Winner selector — always visible for knockout */}
      <div className="px-4 pb-3 border-t border-slate-800/60 pt-2.5">
        <div className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wide">
          {isDraw ? "Empate — quem avança?" : "Quem avança?"}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              onChange({
                ...draft,
                predicted_winner: winner === "home" ? "" : "home",
              })
            }
            disabled={readOnly || impliedWinner === "away"}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors
              ${
                effectiveWinner === "home"
                  ? "bg-yellow-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }
              disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {match.home_team && <Flag team={match.home_team} size="small" />}
            <span className="truncate">{match.home_team ?? "---"}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onChange({
                ...draft,
                predicted_winner: winner === "away" ? "" : "away",
              })
            }
            disabled={readOnly || impliedWinner === "home"}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors
              ${
                effectiveWinner === "away"
                  ? "bg-yellow-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }
              disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <span className="truncate">{match.away_team ?? "---"}</span>
            {match.away_team && <Flag team={match.away_team} size="small" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DevMataMataPage() {
  const router = useRouter();
  const { currentUser } = useAppShell();
  const allowed = DEV_MATA_MATA_ALLOWED.has(currentUser.name);

  useEffect(() => {
    if (!allowed) router.replace("/");
  }, [allowed, router]);

  const { matches, getDraft, savePrediction, isLocked, isLoading } =
    useKnockoutPredictions(currentUser.id);

  if (!allowed) return null;

  const round32 = matches
    .filter((m) => m.round === "r32")
    .sort((a, b) => a.match_number - b.match_number);

  const filledCount = round32.filter((m) => {
    const d = getDraft(m.id);
    return d.predicted_score_home !== "" && d.predicted_score_away !== "";
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Dev Mata-mata</h2>
          <p className="text-slate-400 text-sm">
            Preview da 1ª fase eliminatória com persistência real no Supabase.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-black text-yellow-400">
            {filledCount}/{round32.length}
          </div>
          <div className="text-xs text-slate-500">palpitados</div>
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-500 text-sm">Carregando jogos...</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {BRACKET_GROUPS.map(({ label, range: [from, to] }) => (
            <Card
              key={label}
              className="bg-slate-900 border-slate-800 text-white rounded-3xl"
            >
              <CardContent className="p-5 space-y-3">
                <h3 className="text-base font-black text-yellow-400 uppercase tracking-wide">
                  {label}
                </h3>

                <div className="space-y-3">
                  {round32.slice(from, to).map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      draft={getDraft(match.id)}
                      locked={isLocked(match.id)}
                      onChange={(next) => savePrediction(match.id, next)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
