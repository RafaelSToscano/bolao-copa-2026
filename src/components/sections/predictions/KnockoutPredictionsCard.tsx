"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Flag } from "@/components/ui/Flag";
import { KnockoutMatchRecord, DraftKnockoutPrediction } from "@/types/knockout";
import { Game } from "@/types/game";
import { slotLabel } from "@/lib/knockoutSlotLabel";
import { formatDate, isPast, isToday } from "@/lib/formatting";
import { useKnockoutPredictions } from "@/hooks/useKnockoutPredictions";
import { generateRound32 } from "@/services/standings/knockoutQualification";

type DisplayMatch = KnockoutMatchRecord & {
  isOfficial: boolean;
};

const ROUND32_DATES_BR: Record<number, string> = {
  1: "2026-06-28T16:00:00-03:00",
  2: "2026-06-29T14:00:00-03:00",
  3: "2026-06-29T17:30:00-03:00",
  4: "2026-06-30T14:00:00-03:00",
  5: "2026-06-30T18:00:00-03:00",
  6: "2026-06-30T22:00:00-03:00",
  7: "2026-07-01T22:00:00-03:00",
  8: "2026-07-01T13:00:00-03:00",
  9: "2026-07-01T21:00:00-03:00",
  10: "2026-07-01T17:00:00-03:00",
  11: "2026-07-02T21:00:00-03:00",
  12: "2026-07-02T16:00:00-03:00",
  13: "2026-07-03T00:00:00-03:00",
  14: "2026-07-03T19:00:00-03:00",
  15: "2026-07-03T23:00:00-03:00",
  16: "2026-07-03T22:30:00-03:00",
};

function isGroupComplete(games: Game[], groupName: string): boolean {
  const groupGames = games.filter((game) => game.group_name === groupName);

  return (
    groupGames.length > 0 &&
    groupGames.every(
      (game) =>
        game.official_score_a !== null &&
        game.official_score_b !== null
    )
  );
}

function isSlotReady(slot: string, games: Game[]): boolean {
  const groupMatch = slot.match(/[A-L]/);
  const groupName = groupMatch?.[0];

  if (!groupName) return false;

  return isGroupComplete(games, groupName);
}

function shouldShowTeamForSlot(
  slot: string,
  team: string | null,
  games: Game[]
): boolean {
  if (!team) return false;

  return isSlotReady(slot, games);
}

function buildDisplayMatches(
  matches: KnockoutMatchRecord[],
  games: Game[]
): DisplayMatch[] {
  const simulatedRound32 = generateRound32(games);

  return matches.map((match) => {
    if (match.round !== "r32") {
      return {
        ...match,
        isOfficial: Boolean(match.home_team && match.away_team),
      };
    }

    const simulated = simulatedRound32[match.match_number - 1];

    const homeCandidate = match.home_team ?? simulated?.home?.team ?? null;
    const awayCandidate = match.away_team ?? simulated?.away?.team ?? null;

    const homeTeam = shouldShowTeamForSlot(match.home_slot, homeCandidate, games)
      ? homeCandidate
      : null;

    const awayTeam = shouldShowTeamForSlot(match.away_slot, awayCandidate, games)
      ? awayCandidate
      : null;

    return {
      ...match,
      match_date:
        match.match_date ?? ROUND32_DATES_BR[match.match_number] ?? null,
      home_team: homeTeam,
      away_team: awayTeam,
      isOfficial: Boolean(homeTeam && awayTeam),
    };
  });
}

function MatchRow({
  match,
  draft,
  locked,
  onChange,
  onRandom,
}: {
  match: DisplayMatch;
  draft: DraftKnockoutPrediction;
  locked: boolean;
  onChange: (next: DraftKnockoutPrediction) => void;
  onRandom: (prediction: {
  game_id: string;
  predicted_score_a: number;
  predicted_score_b: number;
}) => void;
}) {
  const readOnly =
  locked ||
  !match.home_team ||
  !match.away_team;

  const past = isPast(match.match_date);
  const today = !past && isToday(match.match_date);

  const rowTone = past
    ? "border-slate-800 bg-emerald-500/[0.05] border-l-2 border-l-emerald-500/60 hover:bg-emerald-500/[0.08]"
    : today
      ? "border-slate-800 bg-amber-500/[0.04] border-l-2 border-l-amber-500/60 hover:bg-amber-500/[0.07]"
      : "border-slate-800 bg-slate-950/40 hover:bg-slate-900/70";

  const homeTeam = match.home_team ?? "Time a definir";
  const awayTeam = match.away_team ?? "Time a definir";

  return (
    <div className={`border-b transition ${rowTone}`}>
      {/* Mobile */}
      <div className="md:hidden p-3 space-y-3">
        <div className="flex items-center justify-between text-slate-300 text-xs">
          <span>{formatDate(match.match_date)}</span>

          <button
  type="button"
  disabled={readOnly}
  onClick={() =>
    onRandom({
      game_id: `knockout-${match.id}`,
      predicted_score_a: Math.floor(Math.random() * 5),
      predicted_score_b: Math.floor(Math.random() * 5),
    })
  }
  className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-black text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
>
  Aleatório
</button>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center justify-end gap-2 min-w-0">
            <span className="font-bold text-sm text-right truncate">
              {homeTeam}
            </span>
            {match.home_team && <Flag team={match.home_team} />}
          </div>

          <div className="flex items-center justify-center gap-2">
            <Input
              type="number"
              min="0"
              disabled={readOnly}
              value={draft.predicted_score_home}
              onChange={(e) =>
                onChange({
                  ...draft,
                  predicted_score_home: e.target.value,
                  predicted_winner: "",
                })
              }
              className="h-11 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
            />

            <span className="font-black text-slate-300">x</span>

            <Input
              type="number"
              min="0"
              disabled={readOnly}
              value={draft.predicted_score_away}
              onChange={(e) =>
                onChange({
                  ...draft,
                  predicted_score_away: e.target.value,
                  predicted_winner: "",
                })
              }
              className="h-11 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
            />
          </div>

          <div className="flex items-center justify-start gap-2 min-w-0">
            {match.away_team && <Flag team={match.away_team} />}
            <span className="font-bold text-sm truncate">
              {awayTeam}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:grid md:grid-cols-[120px_minmax(150px,1fr)_40px_48px_24px_48px_40px_minmax(150px,1fr)_90px] items-center text-white text-lg min-h-[54px] px-4">
        <div className="text-slate-300 text-base whitespace-nowrap">
          {formatDate(match.match_date)}
        </div>

        <div className="text-right font-bold truncate pr-5 text-lg">
          {homeTeam}
        </div>

        <div className="flex justify-center">
          {match.home_team && <Flag team={match.home_team} />}
        </div>

        <div className="flex justify-center">
          <Input
            type="number"
            min="0"
            disabled={readOnly}
            value={draft.predicted_score_home}
            onChange={(e) =>
              onChange({
                ...draft,
                predicted_score_home: e.target.value,
                predicted_winner: "",
              })
            }
            className="h-10 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
          />
        </div>

        <div className="text-center font-bold text-slate-300">x</div>

        <div className="flex justify-center">
          <Input
            type="number"
            min="0"
            disabled={readOnly}
            value={draft.predicted_score_away}
            onChange={(e) =>
              onChange({
                ...draft,
                predicted_score_away: e.target.value,
                predicted_winner: "",
              })
            }
            className="h-10 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
          />
        </div>

        <div className="flex justify-center">
          {match.away_team && <Flag team={match.away_team} />}
        </div>

        <div className="font-bold truncate pl-5 text-lg">
          {awayTeam}
        </div>

        <div className="flex justify-center items-center scale-90 opacity-80 hover:opacity-100 transition pr-2">
          <button
  type="button"
  disabled={readOnly}
  onClick={() =>
    onRandom({
      game_id: `knockout-${match.id}`,
      predicted_score_a: Math.floor(Math.random() * 5),
      predicted_score_b: Math.floor(Math.random() * 5),
    })
  }
  className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-black text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
>
  Aleatório
</button>
        </div>
      </div>
    </div>
  );
}

interface KnockoutPredictionsCardProps {
  playerId: string;
  games: Game[];
}

export function KnockoutPredictionsCard({
  playerId,
  games,
}: KnockoutPredictionsCardProps) {
  const { matches, getDraft, savePrediction, isLocked, isLoading } =
    useKnockoutPredictions(playerId);

  const displayMatches = useMemo(
    () => buildDisplayMatches(matches, games),
    [matches, games]
  );

  const round32 = displayMatches
  .filter((match) => match.round === "r32")
  .sort((a, b) => {
    const dateA = a.match_date ? new Date(a.match_date).getTime() : Number.MAX_SAFE_INTEGER;
    const dateB = b.match_date ? new Date(b.match_date).getTime() : Number.MAX_SAFE_INTEGER;

    if (dateA !== dateB) return dateA - dateB;

    return a.match_number - b.match_number;
  });

  if (isLoading) {
    return (
      <div className="text-slate-500 text-sm">
        Carregando jogos dos 16 avos...
      </div>
    );
  }

  if (round32.length === 0) {
    return null;
  }

  return (
    <div className="space-y-0 bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="bg-gradient-to-r from-[#2A398D] to-slate-900 text-white text-center font-black text-base lg:text-lg py-4 tracking-wide">
        JOGOS - 16 AVOS DE FINAL
      </div>

      {round32.map((match) => (
        <MatchRow
          key={match.id}
          match={match}
          draft={getDraft(match.id)}
          locked={isLocked(match.id)}
          onChange={(next) => {
  if (!match.home_team || !match.away_team) return;
  savePrediction(match.id, next);
}}
          onRandom={(prediction) => {
  if (!match.home_team || !match.away_team) return;

  savePrediction(match.id, {
                 predicted_score_home: String(prediction.predicted_score_a),
    predicted_score_away: String(prediction.predicted_score_b),
    predicted_winner: "",
  });
}}
        />
      ))}
    </div>
  );
}