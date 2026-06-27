"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Flag } from "@/components/ui/Flag";
import { DraftKnockoutPrediction } from "@/types/knockout";
import { Game } from "@/types/game";
import { formatDate, isPast, isToday } from "@/lib/formatting";
import { useKnockoutPredictions } from "@/hooks/useKnockoutPredictions";
import {
  buildDisplayKnockoutMatches,
  DisplayKnockoutMatch,
} from "@/lib/knockoutDisplayMatches";

function MatchRow({
  match,
  draft,
  locked,
  onChange,
  onRandom,
}: {
  match: DisplayKnockoutMatch;
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
    locked || !match.display_home_team || !match.display_away_team;

  const past = isPast(match.match_date);
  const today = !past && isToday(match.match_date);

  const rowTone = past
    ? "border-slate-800 bg-emerald-500/[0.05] border-l-2 border-l-emerald-500/60 hover:bg-emerald-500/[0.08]"
    : today
      ? "border-slate-800 bg-amber-500/[0.04] border-l-2 border-l-amber-500/60 hover:bg-amber-500/[0.07]"
      : "border-slate-800 bg-slate-950/40 hover:bg-slate-900/70";

  const homeTeam = match.display_home_team ?? "Time a definir";
  const awayTeam = match.display_away_team ?? "Time a definir";

  return (
    <div className={`border-b transition ${rowTone}`}>
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
            {match.display_home_team && <Flag team={match.display_home_team} />}
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
              className="h-11 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0 disabled:opacity-40"
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
              className="h-11 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0 disabled:opacity-40"
            />
          </div>

          <div className="flex items-center justify-start gap-2 min-w-0">
            {match.display_away_team && <Flag team={match.display_away_team} />}
            <span className="font-bold text-sm truncate">{awayTeam}</span>
          </div>
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-[120px_minmax(150px,1fr)_40px_48px_24px_48px_40px_minmax(150px,1fr)_90px] items-center text-white text-lg min-h-[54px] px-4">
        <div className="text-slate-300 text-base whitespace-nowrap">
          {formatDate(match.match_date)}
        </div>

        <div className="text-right font-bold truncate pr-5 text-lg">
          {homeTeam}
        </div>

        <div className="flex justify-center">
          {match.display_home_team && <Flag team={match.display_home_team} />}
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
            className="h-10 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0 disabled:opacity-40"
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
            className="h-10 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0 disabled:opacity-40"
          />
        </div>

        <div className="flex justify-center">
          {match.display_away_team && <Flag team={match.display_away_team} />}
        </div>

        <div className="font-bold truncate pl-5 text-lg">{awayTeam}</div>

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
    () => buildDisplayKnockoutMatches(matches, games),
    [matches, games]
  );

  const round32 = displayMatches
    .filter((match) => match.round === "r32")
    .sort((a, b) => {
      const dateA = a.match_date
        ? new Date(a.match_date).getTime()
        : Number.MAX_SAFE_INTEGER;
      const dateB = b.match_date
        ? new Date(b.match_date).getTime()
        : Number.MAX_SAFE_INTEGER;

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
            if (!match.display_home_team || !match.display_away_team) return;
            savePrediction(match.id, next);
          }}
          onRandom={(prediction) => {
            if (!match.display_home_team || !match.display_away_team) return;

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