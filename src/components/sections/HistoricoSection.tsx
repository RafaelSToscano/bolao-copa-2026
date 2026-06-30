"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, XCircle, MinusCircle, Star, X, Trophy, Loader2 } from "lucide-react";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";
import { Player } from "@/types/player";
import { calculatePredictionPoints } from "@/services/predictions/predictionCalculations";
import { calculateKnockoutPredictionPoints } from "@/services/scoring/knockoutPredictionScoring";
import { SCORING_RULES } from "@/config/scoring";
import { Flag } from "@/components/ui/Flag";

// ── Types ────────────────────────────────────────────────────────────────────

type IconType = "exact" | "correct" | "partial" | "wrong" | "none";

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function classifyIcon(
  points: number,
  predictedA: number | null,
  predictedB: number | null
): IconType {
  if (predictedA === null || predictedB === null) return "none";
  if (points === SCORING_RULES.EXACT_SCORE) return "exact";
  if (points >= SCORING_RULES.CORRECT_OUTCOME) return "correct";
  if (points > 0) return "partial";
  return "wrong";
}

const PHASE_LABELS: Record<string, [full: string, short: string]> = {
  group:       ["Grupos",           "Grupos"],
  r32:         ["16 avos de final", "16 avos"],
  r16:         ["Oitavas de final", "Oitavas"],
  qf:          ["Quartas de final", "Quartas"],
  sf:          ["Semifinais",       "Semis"],
  third_place: ["Terceiro lugar",   "3º lugar"],
  final:       ["Final",            "Final"],
};

function phaseLabel(phase: string, short = false): string {
  const entry = PHASE_LABELS[phase];
  if (!entry) return phase;
  return short ? entry[1] : entry[0];
}

// ── Icon component ────────────────────────────────────────────────────────────

function GameIcon({ type, onClick }: { type: IconType; onClick: () => void }) {
  const base = "w-7 h-7 shrink-0 cursor-pointer transition-transform hover:scale-110";

  if (type === "exact")
    return (
      <button onClick={onClick} title="Placar exato">
        <Star className={`${base} text-yellow-400 fill-yellow-400`} />
      </button>
    );
  if (type === "correct")
    return (
      <button onClick={onClick} title="Resultado correto">
        <CheckCircle2 className={`${base} text-emerald-400`} />
      </button>
    );
  if (type === "partial")
    return (
      <button onClick={onClick} title="Pontuação parcial">
        <CheckCircle2 className={`${base} text-amber-400 opacity-70`} />
      </button>
    );
  if (type === "wrong")
    return (
      <button onClick={onClick} title="Errou">
        <XCircle className={`${base} text-red-500`} />
      </button>
    );
  return (
    <button onClick={onClick} title="Sem palpite">
      <MinusCircle className={`${base} text-slate-600`} />
    </button>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ entry, onClose }: { entry: DetailEntry; onClose: () => void }) {
  const { game, result, playerName } = entry;
  const { icon, points, predictedA, predictedB } = result;

  const iconLabel =
    icon === "exact" ? "Placar exato! ⭐"
    : icon === "correct" ? "Resultado correto ✓"
    : icon === "partial" ? "Pontuação parcial"
    : icon === "wrong" ? "Resultado errado"
    : "Sem palpite";

  const iconColor =
    icon === "exact" ? "text-yellow-400"
    : icon === "correct" ? "text-emerald-400"
    : icon === "partial" ? "text-amber-400"
    : icon === "wrong" ? "text-red-400"
    : "text-slate-400";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {phaseLabel(game.phase)}
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Teams & Result */}
        <div className="px-4 py-5">
          <div className="flex items-center justify-between gap-3">
            {/* Team A */}
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <Flag team={game.teamA} size="medium" />
              <span className="text-xs font-bold text-white text-center truncate w-full">{game.teamA}</span>
            </div>

            {/* Scores */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-white tabular-nums">{game.scoreA}</span>
                <span className="text-lg text-slate-500 font-bold">×</span>
                <span className="text-3xl font-black text-white tabular-nums">{game.scoreB}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Resultado</span>
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <Flag team={game.teamB} size="medium" />
              <span className="text-xs font-bold text-white text-center truncate w-full">{game.teamB}</span>
            </div>
          </div>
        </div>

        {/* Prediction & Points */}
        <div className="mx-4 mb-4 rounded-xl bg-slate-800/60 border border-slate-700 divide-y divide-slate-700">
          {/* Player prediction */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-slate-400 font-semibold">Palpite de {playerName}</span>
            {predictedA !== null && predictedB !== null ? (
              <span className="text-sm font-black text-white tabular-nums">
                {predictedA} × {predictedB}
              </span>
            ) : (
              <span className="text-xs text-slate-500 italic">Sem palpite</span>
            )}
          </div>

          {/* Points */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className={`text-sm font-bold ${iconColor}`}>{iconLabel}</span>
            <span className={`text-xl font-black tabular-nums ${points > 0 ? "text-white" : "text-slate-500"}`}>
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

  // Build unified list of last N completed games (newest first in source, reverse for display)
  const lastGames = useMemo<HistGame[]>(() => {
    const completed: HistGame[] = [];

    // Group games with official result
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

    // Knockout matches with official result
    for (const m of knockoutMatches) {
      if (m.official_score_home === null || m.official_score_away === null) continue;
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

    // Sort by date descending → most recent first
    completed.sort((a, b) => b.date.localeCompare(a.date));
    return completed.slice(0, LAST_N);
  }, [games, knockoutMatches]);

  // Per-player results for each game
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
          const icon = classifyIcon(points, pred?.predicted_score_a ?? null, pred?.predicted_score_b ?? null);
          return {
            icon,
            points,
            predictedA: pred?.predicted_score_a ?? null,
            predictedB: pred?.predicted_score_b ?? null,
          };
        } else if (hg.isKnockout && hg.matchId !== undefined) {
          const pred = knockoutPredictions.find(
            (p) => p.player_id === player.id && p.match_id === hg.matchId
          );
          const match = knockoutMatches.find((m) => m.id === hg.matchId);
          if (!match) return { icon: "none" as IconType, points: 0, predictedA: null, predictedB: null };
          const { points } = calculateKnockoutPredictionPoints(pred, match);
          const icon = classifyIcon(points, pred?.predicted_score_home ?? null, pred?.predicted_score_away ?? null);
          return {
            icon,
            points,
            predictedA: pred?.predicted_score_home ?? null,
            predictedB: pred?.predicted_score_away ?? null,
          };
        }
        return { icon: "none" as IconType, points: 0, predictedA: null, predictedB: null };
      });
      byPlayerId.set(player.id, results);
    }

    return byPlayerId;
  }, [ranking, lastGames, predictions, games, knockoutMatches, knockoutPredictions]);

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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-white">Histórico</h2>
        <p className="text-slate-400 text-sm mt-0.5">Últimos {lastGames.length} jogos · clique nos ícones para detalhes</p>
      </div>

      {/* Table wrapper — horizontal scroll on mobile, sticky player column */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
        <table className="w-full min-w-[480px] text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-800">
              {/* Sticky player column header */}
              <th className="text-left px-3 py-3 text-slate-400 font-semibold text-xs sticky left-0 bg-slate-900 z-20 border-r border-slate-800">
                Jogador
              </th>
              <th className="text-right px-3 py-3 text-slate-400 font-semibold text-xs">Pts</th>
              {/* Game columns — most recent first */}
              {lastGames.map((g) => (
                <th key={g.key} className="px-2 py-2 text-center min-w-[44px]">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wide leading-tight">
                      {phaseLabel(g.phase, true)}
                    </span>
                    <div className="flex flex-col sm:flex-row items-center gap-0.5">
                      <Flag team={g.teamA} size="small" />
                      <span className="text-[8px] text-slate-600 leading-none">×</span>
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
                  {/* Sticky player cell — solid bg required to occlude scrolling content */}
                  <td className={`px-3 py-3 sticky left-0 z-10 border-r border-slate-800 bg-slate-900 ${isMe ? "border-l-2 border-l-yellow-500/60" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[11px] font-bold tabular-nums w-4 shrink-0">
                        {player.position}
                      </span>
                      <span className={`font-bold text-sm leading-tight ${isMe ? "text-yellow-400" : "text-white"}`}>
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
                    <span className="font-black text-white tabular-nums">{player.total}</span>
                  </td>
                  {results.map((result, gi) => (
                    <td key={lastGames[gi].key} className="px-2 py-2 text-center">
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

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 px-1 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><Star size={13} className="text-yellow-400 fill-yellow-400" /> Placar exato ({SCORING_RULES.EXACT_SCORE} pts)</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Resultado correto ({SCORING_RULES.CORRECT_OUTCOME}+ pts)</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-amber-400 opacity-70" /> Parcial (1–6 pts)</span>
        <span className="flex items-center gap-1.5"><XCircle size={13} className="text-red-500" /> Errou (0 pts)</span>
        <span className="flex items-center gap-1.5"><MinusCircle size={13} className="text-slate-600" /> Sem palpite</span>
      </div>

      {/* Detail modal */}
      {detail && <DetailModal entry={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
