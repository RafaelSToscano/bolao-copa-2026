"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Flag } from "@/components/ui/Flag";
import { KnockoutMatchRecord, DraftKnockoutPrediction } from "@/types/knockout";
import { Game } from "@/types/game";
import { slotLabel } from "@/lib/knockoutSlotLabel";
import { useKnockoutPredictions } from "@/hooks/useKnockoutPredictions";
import { generateRound32 } from "@/services/standings/knockoutQualification";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BRACKET_GROUPS = [
  { label: "Chave A", range: [0, 4] as [number, number] },
  { label: "Chave B", range: [4, 8] as [number, number] },
  { label: "Chave C", range: [8, 12] as [number, number] },
  { label: "Chave D", range: [12, 16] as [number, number] },
];

type DisplayMatch = KnockoutMatchRecord & { isOfficial: boolean };

// Round of 32 slots without an official team yet are filled in with a live
// preview computed from the current official group-stage results, so
// players see a projected matchup instead of "---" while the group stage
// is still wrapping up. Predictions stay locked until admin records the
// real teams (see `isOfficial`) — R16+ aren't simulated, since projecting
// them would mean guessing the winner of a match that hasn't happened yet.
function buildDisplayMatches(matches: KnockoutMatchRecord[], games: Game[]): DisplayMatch[] {
  const simulatedRound32 = generateRound32(games);

  return matches.map((match) => {
    const isOfficial = Boolean(match.home_team && match.away_team);

    if (isOfficial || match.round !== "r32") {
      return { ...match, isOfficial };
    }

    const simulated = simulatedRound32[match.match_number - 1];
    return {
      ...match,
      home_team: match.home_team ?? simulated?.home?.team ?? null,
      away_team: match.away_team ?? simulated?.away?.team ?? null,
      isOfficial: false,
    };
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MatchCard({
  match,
  draft,
  locked,
  onChange,
}: {
  match: DisplayMatch;
  draft: DraftKnockoutPrediction;
  locked: boolean;
  onChange: (next: DraftKnockoutPrediction) => void;
}) {
  const scoreHome = draft.predicted_score_home;
  const scoreAway = draft.predicted_score_away;
  const readOnly = locked || !match.isOfficial;

  const effectiveWinner: "home" | "away" | null =
    scoreHome !== "" && scoreAway !== "" && scoreHome !== scoreAway
      ? Number(scoreHome) > Number(scoreAway)
        ? "home"
        : "away"
      : null;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Card header */}
      <div className="px-4 py-1.5 bg-slate-800/50 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
          Jogo {match.match_number}
        </span>
        <span className="text-xs text-slate-600">
          {match.isOfficial ? "1ª Fase Eliminatória" : "Simulado — times a confirmar"}
        </span>
      </div>

      {/* Teams + score inputs */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Home */}
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
              className={`block font-bold text-sm truncate ${effectiveWinner === "home" ? "text-yellow-400" : ""}`}
            >
              {match.home_team ?? "---"}
            </span>
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
            {match.away_team && (
              <div className="mb-1">
                <Flag team={match.away_team} size="small" />
              </div>
            )}
            <span
              className={`block font-bold text-sm truncate ${effectiveWinner === "away" ? "text-yellow-400" : ""}`}
            >
              {match.away_team ?? "---"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

interface KnockoutPredictionsCardProps {
  playerId: string;
  games: Game[];
  disabled?: boolean;
}

export function KnockoutPredictionsCard({
  playerId,
  games,
  disabled = false,
}: KnockoutPredictionsCardProps) {
  const { matches, getDraft, savePrediction, isLocked, isLoading } =
    useKnockoutPredictions(playerId);

  const displayMatches = useMemo(() => buildDisplayMatches(matches, games), [matches, games]);

  const round32 = displayMatches
    .filter((m) => m.round === "r32")
    .sort((a, b) => a.match_number - b.match_number);

  const filledCount = round32.filter((m) => {
    const d = getDraft(m.id);
    return d.predicted_score_home !== "" && d.predicted_score_away !== "";
  }).length;

  return (
    <div className="space-y-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[28px] p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl lg:text-3xl font-black tracking-tight">Mata-mata</h3>
          <p className="text-slate-400 text-sm mt-1">
            Faça seus palpites para a 1ª fase eliminatória.
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
              className="bg-slate-950/60 border-slate-800 text-white rounded-3xl"
            >
              <CardContent className="p-5 space-y-3">
                <h4 className="text-base font-black text-yellow-400 uppercase tracking-wide">
                  {label}
                </h4>

                <div className="space-y-3">
                  {round32.slice(from, to).map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      draft={getDraft(match.id)}
                      locked={disabled || isLocked(match.id)}
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
