"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Star,
  X,
  Trophy,
  Loader2,
} from "lucide-react";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";
import { Player } from "@/types/player";
import { calculatePredictionPoints } from "@/services/predictions/predictionCalculations";
import { calculateKnockoutPredictionPoints } from "@/services/scoring/knockoutPredictionScoring";
import { Flag } from "@/components/ui/Flag";

// ── Types ────────────────────────────────────────────────────────────────────

type IconType =
  | "exact"
  | "correctWithOneScore"
  | "correct"
  | "oneScore"
  | "wrong"
  | "none";

type HistGame = {
  key: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  date: string;
  phase: string;
  isKnockout: boolean;
  gameId?: string;
  matchId?: number;
};

type PlayerResult = {
  icon: IconType;
  points: number;
  predictedA: number | null;
  predictedB: number | null;
};

type DetailEntry = {
  game: HistGame;
  result: PlayerResult;
  playerName: string;
};

const LAST_N = 7;

const HISTORICO_POINTS = {
  EXACT_SCORE: 15,
  CORRECT_OUTCOME_WITH_ONE_SCORE: 9,
  CORRECT_OUTCOME: 7,
  ONE_SCORE: 2,
  WRONG: 0,
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function classifyIcon(
  points: number,
  predictedA: number | null,
  predictedB: number | null
): IconType {
  if (predictedA === null || predictedB === null) return "none";

  if (points === HISTORICO_POINTS.EXACT_SCORE) return "exact";

  if (points === HISTORICO_POINTS.CORRECT_OUTCOME_WITH_ONE_SCORE) {
    return "correctWithOneScore";
  }

  if (points === HISTORICO_POINTS.CORRECT_OUTCOME) return "correct";

  if (points === HISTORICO_POINTS.ONE_SCORE) return "oneScore";

  if (points > 0) return "oneScore";

  return "wrong";
}

const PHASE_LABELS: Record<string, [full: string, short: string]> = {
  group: ["Grupos", "Grupos"],
  r32: ["16 avos de final", "16 avos"],
  r16: ["Oitavas de final", "Oitavas"],
  qf: ["Quartas de final", "Quartas"],
  sf: ["Semifinais", "Semis"],
  third_place: ["Terceiro lugar", "3º lugar"],
  final: ["Final", "Final"],
};

function phaseLabel(phase: string, short = false): string {
  const entry = PHASE_LABELS[phase];
  if (!entry) return phase;
  return short ? entry[1] : entry[0];
}

// ── Icon component ────────────────────────────────────────────────────────────

function GameIcon({ type, onClick }: { type: IconType; onClick: () => void }) {
  const base =
    "w-7 h-7 shrink-0 cursor-pointer transition-transform hover:scale-110";

  if (type === "exact") {
    return (
      <button type="button" onClick={onClick} title="Placar exato - 15 pts">
        <Star className={`${base} text-yellow-400 fill-yellow-400`} />
      </button>
    );
  }

  if (type === "correctWithOneScore") {
    return (
      <button
        type="button"
        onClick={onClick}
        title="Resultado correto + 1 dos placares - 9 pts"
        className="relative"
      >
        <CheckCircle2 className={`${base} text-emerald-400`} />
        <span className="absolute -right-1 -top-1 rounded-full bg-emerald-400 px-1 text-[8px] font-black leading-3 text-slate-950">
          +1
        </span>
      </button>
    );
  }

  if (type === "correct") {
    return (
      <button type="button" onClick={onClick} title="Resultado correto - 7 pts">
        <CheckCircle2 className={`${base} text-emerald-400 opacity-80`} />
      </button>
    );
  }

  if (type === "oneScore") {
    return (
      <button
        type="button"
        onClick={onClick}
        title="Acertou 1 dos placares - 2 pts"
      >
        <CheckCircle2 className={`${base} text-amber-400 opacity-80`} />
      </button>
    );
  }

  if (type === "wrong") {
    return (
      <button type="button" onClick={onClick} title="Errou - 0 pts">
        <XCircle className={`${base} text-red-500`} />
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} title="Sem palpite">
      <MinusCircle className={`${base} text-slate-600`} />
    </button>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({
  entry,
  onClose,
}: {
  entry: DetailEntry;
  onClose: () => void;
}) {
  const { game, result, playerName } = entry;
  const { icon, points, predictedA, predictedB } = result;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const iconLabel: Record<IconType, string> = {
    exact: "Placar exato",
    correctWithOneScore: "Resultado correto + 1 dos placares",
    correct: "Resultado correto",
    oneScore: "Acertou 1 dos placares",
    wrong: "Errou",
    none: "Sem palpite",
  };

  const iconColor: Record<IconType, string> = {
    exact: "text-yellow-400",
    correctWithOneScore: "text-emerald-400",
    correct: "text-emerald-400",
    oneScore: "text-amber-400",
    wrong: "text-red-400",
    none: "text-slate-400",
  };

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-[100dvh] items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar detalhes"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {phaseLabel(game.phase)}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="px-4 py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <Flag team={game.teamA} size="medium" />
              <span className="text-xs font-bold text-white text-center truncate w-full">
                {game.teamA}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-white tabular-nums">
                  {game.scoreA}
                </span>
                <span className="text-lg text-slate-500 font-bold">×</span>
                <span className="text-3xl font-black text-white tabular-nums">
                  {game.scoreB}
                </span>
              </div>

              <span className="text-[10px] text-slate-500 font-semibold uppercase">
                Resultado
              </span>
            </div>

            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <Flag team={game.teamB} size="medium" />
              <span className="text-xs font-bold text-white text-center truncate w-full">
                {game.teamB}
              </span>
            </div>
          </div>
        </div>

        <div className="mx-4 mb-4 rounded-xl bg-slate-800/60 border border-slate-700 divide-y divide-slate-700">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="text-xs text-slate-400 font-semibold">
              Palpite de {playerName}
            </span>

            {predictedA !== null && predictedB !== null ? (
              <span className="text-sm font-black text-white tabular-nums">
                {predictedA} × {predictedB}
              </span>
            ) : (
              <span className="text-xs text-slate-500 italic">Sem palpite</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <span className={`text-sm font-bold ${iconColor[icon]}`}>
              {iconLabel[icon]}
            </span>

            <span
              className={`text-xl font-black tabular-nums ${
                points > 0 ? "text-white" : "text-slate-500"
              }`}
            >
              {points > 0 ? `+${points}` : "0"} pts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────

interface HistoricoSectionProps {
  ranking: (Player & { total: number; exacts: number; position: number })[];
  games: Game[];
  predictions: Prediction[];
  knockoutMatches: KnockoutMatchRecord[];
  knockoutPredictions: KnockoutPrediction[];
  currentUserId?: string;
}

export function HistoricoSection({
  ranking,
  games,
  predictions,
  knockoutMatches,
  knockoutPredictions,
  currentUserId,
}: HistoricoSectionProps) {
  const [detail, setDetail] = useState<DetailEntry | null>(null);

  const lastGames = useMemo<HistGame[]>(() => {
    const completed: HistGame[] = [];

    for (const g of games) {
      if (g.official_score_a === null || g.official_score_b === null) continue;

      completed.push({
        key: `g-${g.id}`,
        teamA: g.team_a,
        teamB: g.team_b,
        scoreA: g.official_score_a,
        scoreB: g.official_score_b,
        date: g.match_date ?? "",
        phase: g.group_name ? "group" : g.phase,
        isKnockout: false,
        gameId: g.id,
      });
    }

    for (const m of knockoutMatches) {
      if (m.official_score_home === null || m.official_score_away === null) {
        continue;
      }

      if (!m.home_team || !m.away_team) continue;

      completed.push({
        key: `k-${m.id}`,
        teamA: m.home_team,
        teamB: m.away_team,
        scoreA: m.official_score_home,
        scoreB: m.official_score_away,
        date: m.match_date ?? "",
        phase: m.round,
        isKnockout: true,
        matchId: m.id,
      });
    }

    completed.sort((a, b) => b.date.localeCompare(a.date));

    return completed.slice(0, LAST_N);
  }, [games, knockoutMatches]);

  const playerResults = useMemo(() => {
    const byPlayerId = new Map<string, PlayerResult[]>();

    for (const player of ranking) {
      const results: PlayerResult[] = lastGames.map((hg) => {
        if (!hg.isKnockout && hg.gameId) {
          const pred = predictions.find(
            (p) => p.player_id === player.id && p.game_id === hg.gameId
          );

          const game = games.find((g) => g.id === hg.gameId);
          const { points } = calculatePredictionPoints(pred, game);

          const icon = classifyIcon(
            points,
            pred?.predicted_score_a ?? null,
            pred?.predicted_score_b ?? null
          );

          return {
            icon,
            points,
            predictedA: pred?.predicted_score_a ?? null,
            predictedB: pred?.predicted_score_b ?? null,
          };
        }

        if (hg.isKnockout && hg.matchId !== undefined) {
          const pred = knockoutPredictions.find(
            (p) => p.player_id === player.id && p.match_id === hg.matchId
          );

          const match = knockoutMatches.find((m) => m.id === hg.matchId);

          if (!match) {
            return {
              icon: "none" as IconType,
              points: 0,
              predictedA: null,
              predictedB: null,
            };
          }

          const { points } = calculateKnockoutPredictionPoints(pred, match);

          const icon = classifyIcon(
            points,
            pred?.predicted_score_home ?? null,
            pred?.predicted_score_away ?? null
          );

          return {
            icon,
            points,
            predictedA: pred?.predicted_score_home ?? null,
            predictedB: pred?.predicted_score_away ?? null,
          };
        }

        return {
          icon: "none" as IconType,
          points: 0,
          predictedA: null,
          predictedB: null,
        };
      });

      byPlayerId.set(player.id, results);
    }

    return byPlayerId;
  }, [
    ranking,
    lastGames,
    predictions,
    games,
    knockoutMatches,
    knockoutPredictions,
  ]);

  if (ranking.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
        <Loader2 size={32} className="animate-spin opacity-50" />
      </div>
    );
  }

  if (lastGames.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
        <Trophy size={40} className="opacity-30" />
        <p className="font-semibold">Ainda não há jogos concluídos.</p>
      </div>
    );
  }

  const headerClass =
    "px-3 py-3 text-center align-middle text-slate-300 font-black text-sm md:text-base";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-white">Histórico</h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Últimos {lastGames.length} jogos · clique nos ícones para detalhes
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
        <table className="w-full min-w-[480px] text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-800">
              <th
                className={`${headerClass} sticky left-0 bg-slate-900 z-20 border-r border-slate-800`}
              >
                Jogador
              </th>

              <th className={`${headerClass} min-w-[70px]`}>Pts</th>

              {lastGames.map((g) => (
                <th key={g.key} className="px-2 py-2 text-center min-w-[44px]">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wide leading-tight">
                      {phaseLabel(g.phase, true)}
                    </span>

                    <div className="flex flex-col sm:flex-row items-center gap-0.5">
                      <Flag team={g.teamA} size="small" />
                      <span className="text-[8px] text-slate-600 leading-none">
                        ×
                      </span>
                      <Flag team={g.teamB} size="small" />
                    </div>

                    <span className="text-[9px] text-slate-600 tabular-nums font-semibold">
                      {g.scoreA}–{g.scoreB}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {ranking.map((player) => {
              const results = playerResults.get(player.id) ?? [];
              const isMe = player.id === currentUserId;

              return (
                <tr
                  key={player.id}
                  className={`border-b border-slate-800/50 last:border-0 transition-colors ${
                    isMe ? "bg-yellow-500/5" : "hover:bg-slate-800/30"
                  }`}
                >
                  <td
                    className={`px-3 py-3 sticky left-0 z-10 border-r border-slate-800 ${
                      isMe
                        ? "bg-slate-900 border-l-2 border-l-yellow-500/60"
                        : "bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[11px] font-bold tabular-nums w-4 shrink-0">
                        {player.position}
                      </span>

                      <span
                        className={`font-bold text-sm leading-tight ${
                          isMe ? "text-yellow-400" : "text-white"
                        }`}
                      >
                        {player.name}

                        {isMe && (
                          <span className="block text-[10px] text-yellow-500/60 font-semibold leading-none mt-0.5">
                            você
                          </span>
                        )}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-3 text-right">
                    <span className="font-black text-white tabular-nums">
                      {player.total}
                    </span>
                  </td>

                  {results.map((result, gi) => (
                    <td
                      key={lastGames[gi].key}
                      className="px-2 py-2 text-center"
                    >
                      <div className="flex justify-center">
                        <GameIcon
                          type={result.icon}
                          onClick={() =>
                            setDetail({
                              game: lastGames[gi],
                              result,
                              playerName: player.name,
                            })
                          }
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 px-1 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Star size={13} className="text-yellow-400 fill-yellow-400" />
          Placar exato <strong className="text-slate-200">15 pts</strong>
        </span>

        <span className="flex items-center gap-1.5">
          <span className="relative inline-flex">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span className="absolute -right-1.5 -top-1 rounded-full bg-emerald-400 px-0.5 text-[7px] font-black leading-3 text-slate-950">
              +1
            </span>
          </span>
          Resultado correto + 1 dos placares{" "}
          <strong className="text-slate-200">9 pts</strong>
        </span>

        <span className="flex items-center gap-1.5">
          <CheckCircle2 size={13} className="text-emerald-400 opacity-80" />
          Resultado correto <strong className="text-slate-200">7 pts</strong>
        </span>

        <span className="flex items-center gap-1.5">
          <CheckCircle2 size={13} className="text-amber-400 opacity-80" />
          Acertou 1 dos placares{" "}
          <strong className="text-slate-200">2 pts</strong>
        </span>

        <span className="flex items-center gap-1.5">
          <XCircle size={13} className="text-red-500" />
          Errou <strong className="text-slate-200">0 pts</strong>
        </span>

        <span className="flex items-center gap-1.5">
          <MinusCircle size={13} className="text-slate-600" />
          Sem palpite
        </span>
      </div>

      {detail && <DetailModal entry={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}