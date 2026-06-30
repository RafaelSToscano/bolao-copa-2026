"use client";

import { useMemo, useState } from "react";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { Player } from "@/types/player";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flag } from "@/components/ui/Flag";
import { formatDate, exportAuditCsv } from "@/lib/formatting";
import { calculatePredictionPoints } from "@/services/predictions/predictionCalculations";
import { RankingShareModal } from "@/components/ui/RankingShareModal";
import { buildDisplayKnockoutMatches } from "@/lib/knockoutDisplayMatches";
import { Share2, List } from "lucide-react";

interface AdminSectionProps {
  games: Game[];
  predictions: Prediction[];
  knockoutMatches: KnockoutMatchRecord[];
  knockoutPredictions: KnockoutPrediction[];
  players: Player[];
  ranking: (Player & { total: number; exacts: number; position: number })[];
  onUpdateResult: (
    gameId: string,
    field: "official_score_a" | "official_score_b",
    value: string
  ) => void;
  onUpdateKnockoutResult: (
    matchId: number,
    scoreHome: number | null,
    scoreAway: number | null,
    winnerTeam?: string | null,
    homeTeam?: string | null,
    awayTeam?: string | null
  ) => Promise<void>;
  onApprovePlayer: (playerId: string) => void;
  onRejectPlayer: (playerId: string) => void;
  stats: {
    totalPlayers: number;
    approvedPlayers: number;
    pendingPlayers: number;
    activePlayers: number;
    incompletePlayers: number;
    zeroPlayers: number;
  };
}

export function AdminSection({
  games,
  predictions,
  knockoutMatches,
  knockoutPredictions,
  players,
  ranking,
  onUpdateResult,
  onUpdateKnockoutResult,
  onApprovePlayer,
  onRejectPlayer,
  stats,
}: AdminSectionProps) {
  const [shareMode, setShareMode] = useState<"highlight" | "full" | null>(null);

  const [knockoutDrafts, setKnockoutDrafts] = useState<
    Record<number, { home: string; away: string; winner: string }>
  >({});

  const sortedGames = useMemo(
    () =>
      [...games].sort((a, b) => {
        const dateA = a.match_date
          ? new Date(a.match_date).getTime()
          : Number.MAX_SAFE_INTEGER;
        const dateB = b.match_date
          ? new Date(b.match_date).getTime()
          : Number.MAX_SAFE_INTEGER;

        return dateA - dateB;
      }),
    [games]
  );

  const round32Matches = useMemo(
    () =>
      buildDisplayKnockoutMatches(knockoutMatches, games)
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
        }),
    [knockoutMatches, games]
  );

  const knockoutAuditMatches = useMemo(
    () =>
      buildDisplayKnockoutMatches(knockoutMatches, games)
        .filter((match) => match.display_home_team && match.display_away_team)
        .sort((a, b) => {
          const dateA = a.match_date
            ? new Date(a.match_date).getTime()
            : Number.MAX_SAFE_INTEGER;
          const dateB = b.match_date
            ? new Date(b.match_date).getTime()
            : Number.MAX_SAFE_INTEGER;

          if (dateA !== dateB) return dateA - dateB;

          return a.match_number - b.match_number;
        }),
    [knockoutMatches, games]
  );

  const knockoutPredictionAudit = useMemo(() => {
    const approvedPlayers = players.filter(
      (player) => player.approved && !player.is_admin
    );

    return approvedPlayers
      .map((player) => {
        const missingMatches = knockoutAuditMatches.filter((match) => {
          const prediction = knockoutPredictions.find(
            (item) => item.player_id === player.id && item.match_id === match.id
          );

          return (
            !prediction ||
            prediction.predicted_score_home === null ||
            prediction.predicted_score_away === null
          );
        });

        return {
          player,
          total: knockoutAuditMatches.length,
          completed: knockoutAuditMatches.length - missingMatches.length,
          missingMatches,
        };
      })
      .sort((a, b) => {
        const missingA = a.total - a.completed;
        const missingB = b.total - b.completed;

        if (missingA !== missingB) return missingB - missingA;

        return a.player.name.localeCompare(b.player.name);
      });
  }, [players, knockoutAuditMatches, knockoutPredictions]);

  const getKnockoutDraft = (match: (typeof round32Matches)[number]) =>
    knockoutDrafts[match.id] ?? {
      home: match.official_score_home?.toString() ?? "",
      away: match.official_score_away?.toString() ?? "",
      winner: match.winner_team ?? "",
    };

  const parseScore = (value: string): number | null => {
    if (value === "") return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const getAutomaticWinner = (
    scoreHome: number | null,
    scoreAway: number | null,
    homeTeam?: string | null,
    awayTeam?: string | null
  ): string | null => {
    if (scoreHome === null || scoreAway === null) return null;
    if (!homeTeam || !awayTeam) return null;
    if (scoreHome > scoreAway) return homeTeam;
    if (scoreAway > scoreHome) return awayTeam;
    return null;
  };

  const handleKnockoutScoreChange = async (
    match: (typeof round32Matches)[number],
    field: "home" | "away",
    value: string
  ) => {
    const currentDraft = getKnockoutDraft(match);

    const rawDraft = {
      ...currentDraft,
      [field]: value,
    };

    const bothEmpty = rawDraft.home === "" && rawDraft.away === "";
    const bothFilled = rawDraft.home !== "" && rawDraft.away !== "";

    const scoreHome = bothEmpty ? null : parseScore(rawDraft.home);
    const scoreAway = bothEmpty ? null : parseScore(rawDraft.away);

    if (!bothEmpty && !bothFilled) {
      setKnockoutDrafts((prev) => ({
        ...prev,
        [match.id]: rawDraft,
      }));
      return;
    }

    if (
      scoreHome !== null &&
      scoreAway !== null &&
      (Number.isNaN(scoreHome) || Number.isNaN(scoreAway))
    ) {
      return;
    }

    const automaticWinner = getAutomaticWinner(
      scoreHome,
      scoreAway,
      match.display_home_team,
      match.display_away_team
    );

    const nextDraft = {
      ...rawDraft,
      winner: bothEmpty ? "" : automaticWinner ?? rawDraft.winner ?? "",
    };

    setKnockoutDrafts((prev) => ({
      ...prev,
      [match.id]: nextDraft,
    }));

    if (bothEmpty) {
      await onUpdateKnockoutResult(
        match.id,
        null,
        null,
        null,
        match.display_home_team,
        match.display_away_team
      );
      return;
    }

    if (scoreHome === null || scoreAway === null) return;

    const isDraw = scoreHome === scoreAway;

    if (isDraw && !nextDraft.winner) {
      return;
    }

    await onUpdateKnockoutResult(
      match.id,
      scoreHome,
      scoreAway,
      isDraw ? nextDraft.winner : automaticWinner,
      match.display_home_team,
      match.display_away_team
    );
  };

  const handleKnockoutWinnerChange = async (
    match: (typeof round32Matches)[number],
    winnerTeam: string
  ) => {
    const currentDraft = getKnockoutDraft(match);

    const scoreHome = parseScore(currentDraft.home);
    const scoreAway = parseScore(currentDraft.away);

    setKnockoutDrafts((prev) => ({
      ...prev,
      [match.id]: {
        ...currentDraft,
        winner: winnerTeam,
      },
    }));

    if (scoreHome === null || scoreAway === null) return;
    if (scoreHome !== scoreAway) return;

    await onUpdateKnockoutResult(
      match.id,
      scoreHome,
      scoreAway,
      winnerTeam,
      match.display_home_team,
      match.display_away_team
    );
  };

  const handleExportCsv = async () => {
    try {
      await exportAuditCsv(players, games, predictions, calculatePredictionPoints);
    } catch (error) {
      console.error(error);
      alert("Erro ao exportar auditoria CSV.");
    }
  };

  const handleExportKnockoutAuditCsv = () => {
    const header = [
      "Participante",
      "Status",
      "Preenchidos",
      "Total",
      "Faltam",
      "Jogos faltantes",
    ];

    const rows = knockoutPredictionAudit.map((item) => {
      const missingCount = item.total - item.completed;
      const missingGames = item.missingMatches
        .map(
          (match) =>
            `Jogo ${match.match_number}: ${match.display_home_team} x ${match.display_away_team}`
        )
        .join(" | ");

      return [
        item.player.name,
        missingCount === 0 ? "Completo" : "Incompleto",
        item.completed,
        item.total,
        missingCount,
        missingGames,
      ];
    });

    const escapeCsv = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "auditoria-palpites-mata-mata.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderGroupResultRow = (game: Game) => (
    <div
      key={game.id}
      className="border border-slate-800 bg-slate-950/80 rounded-2xl overflow-hidden shadow-lg"
    >
      <div className="md:hidden p-3 space-y-3 bg-slate-950/40">
        <div className="text-slate-300 text-xs">
          {formatDate(game.match_date)}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center justify-end gap-2 min-w-0">
            <span className="font-bold text-sm text-right truncate">
              {game.team_a}
            </span>
            <Flag team={game.team_a} />
          </div>

          <div className="flex items-center justify-center gap-2">
            <Input
              type="number"
              min="0"
              value={game.official_score_a ?? ""}
              onChange={(e) =>
                onUpdateResult(game.id, "official_score_a", e.target.value)
              }
              className="h-11 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
            />

            <span className="font-black text-slate-300">x</span>

            <Input
              type="number"
              min="0"
              value={game.official_score_b ?? ""}
              onChange={(e) =>
                onUpdateResult(game.id, "official_score_b", e.target.value)
              }
              className="h-11 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
            />
          </div>

          <div className="flex items-center justify-start gap-2 min-w-0">
            <Flag team={game.team_b} />
            <span className="font-bold text-sm truncate">{game.team_b}</span>
          </div>
        </div>
      </div>

      <div className="hidden md:grid md:grid-cols-[120px_minmax(150px,1fr)_40px_48px_24px_48px_40px_minmax(150px,1fr)] items-center bg-slate-950/40 border-b border-slate-800 hover:bg-slate-900/70 transition text-white text-lg min-h-[54px] px-4">
        <div className="text-slate-300 text-base whitespace-nowrap">
          {formatDate(game.match_date)}
        </div>

        <div className="text-right font-bold truncate pr-5 text-lg">
          {game.team_a}
        </div>

        <div className="flex justify-center">
          <Flag team={game.team_a} />
        </div>

        <div className="flex justify-center">
          <Input
            type="number"
            min="0"
            value={game.official_score_a ?? ""}
            onChange={(e) =>
              onUpdateResult(game.id, "official_score_a", e.target.value)
            }
            className="h-10 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
          />
        </div>

        <div className="text-center font-bold text-slate-300">x</div>

        <div className="flex justify-center">
          <Input
            type="number"
            min="0"
            value={game.official_score_b ?? ""}
            onChange={(e) =>
              onUpdateResult(game.id, "official_score_b", e.target.value)
            }
            className="h-10 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
          />
        </div>

        <div className="flex justify-center">
          <Flag team={game.team_b} />
        </div>

        <div className="font-bold truncate pl-5 text-lg">{game.team_b}</div>
      </div>
    </div>
  );

  const renderKnockoutResultRow = (match: (typeof round32Matches)[number]) => {
    const draft = getKnockoutDraft(match);
    const homeTeam = match.display_home_team ?? "Time a definir";
    const awayTeam = match.display_away_team ?? "Time a definir";
    const disabled = !match.display_home_team || !match.display_away_team;

    const isDraw =
      draft.home !== "" &&
      draft.away !== "" &&
      Number(draft.home) === Number(draft.away);

    const canSelectWinner =
      isDraw && !!match.display_home_team && !!match.display_away_team;

    const winnerSelector = canSelectWinner ? (
      <div className="px-3 md:px-4 pb-3">
        <div className="flex flex-col md:flex-row md:items-center gap-2 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-3">
          <div className="text-xs font-black uppercase tracking-widest text-yellow-300 whitespace-nowrap">
            🏆 Classificado:
          </div>

          <div className="flex flex-wrap gap-2">
            {[match.display_home_team!, match.display_away_team!].map((team) => (
              <button
                key={team}
                type="button"
                onClick={() => handleKnockoutWinnerChange(match, team)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black border transition ${
                  draft.winner === team
                    ? "bg-yellow-400 text-slate-950 border-yellow-300"
                    : "bg-slate-900 text-white border-slate-700 hover:bg-slate-800"
                }`}
              >
                <Flag team={team} />
                {team}
              </button>
            ))}
          </div>
        </div>
      </div>
    ) : null;

    return (
      <div
        key={match.id}
        className="border border-slate-800 bg-slate-950/80 rounded-2xl overflow-hidden shadow-lg"
      >
        <div className="md:hidden p-3 space-y-3 bg-slate-950/40">
          <div className="text-slate-300 text-xs">
            {formatDate(match.match_date)}
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
                disabled={disabled}
                value={draft.home}
                onChange={(e) =>
                  handleKnockoutScoreChange(match, "home", e.target.value)
                }
                className="h-11 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0 disabled:opacity-40"
              />

              <span className="font-black text-slate-300">x</span>

              <Input
                type="number"
                min="0"
                disabled={disabled}
                value={draft.away}
                onChange={(e) =>
                  handleKnockoutScoreChange(match, "away", e.target.value)
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

        <div className="hidden md:grid md:grid-cols-[120px_minmax(150px,1fr)_40px_48px_24px_48px_40px_minmax(150px,1fr)] items-center bg-slate-950/40 border-b border-slate-800 hover:bg-slate-900/70 transition text-white text-lg min-h-[54px] px-4">
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
              disabled={disabled}
              value={draft.home}
              onChange={(e) =>
                handleKnockoutScoreChange(match, "home", e.target.value)
              }
              className="h-10 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0 disabled:opacity-40"
            />
          </div>

          <div className="text-center font-bold text-slate-300">x</div>

          <div className="flex justify-center">
            <Input
              type="number"
              min="0"
              disabled={disabled}
              value={draft.away}
              onChange={(e) =>
                handleKnockoutScoreChange(match, "away", e.target.value)
              }
              className="h-10 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0 disabled:opacity-40"
            />
          </div>

          <div className="flex justify-center">
            {match.display_away_team && <Flag team={match.display_away_team} />}
          </div>

          <div className="font-bold truncate pl-5 text-lg">{awayTeam}</div>
        </div>

        {winnerSelector}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight">
            Painel Admin
          </h2>

          <p className="text-slate-300 text-base mt-1">
            Aprove participantes e lance os resultados oficiais dos jogos.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setShareMode("highlight")}
            className="bg-green-600 hover:bg-green-500 text-white font-bold gap-2"
          >
            <Share2 size={16} />
            Compartilhar Ranking
          </Button>

          <Button
            onClick={() => setShareMode("full")}
            className="bg-slate-600 hover:bg-slate-500 text-white font-bold gap-2"
          >
            <List size={16} />
            Ranking Completo
          </Button>

          <Button
            onClick={handleExportCsv}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
          >
            Exportar auditoria CSV
          </Button>

          <Button
            onClick={handleExportKnockoutAuditCsv}
            className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold"
          >
            Exportar mata-mata CSV
          </Button>
        </div>
      </div>

      {shareMode !== null && (
        <RankingShareModal
          ranking={ranking}
          games={games}
          predictions={predictions}
          players={players}
          showAll={shareMode === "full"}
          onClose={() => setShareMode(null)}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl min-h-[120px] lg:min-h-[130px] flex items-center justify-center shadow-2xl">
          <CardContent className="p-5 text-center flex flex-col items-center justify-center gap-2">
            <div className="text-sm lg:text-lg font-bold text-slate-300">
              Participantes
            </div>
            <div className="text-4xl lg:text-5xl font-black text-yellow-400">
              {stats.totalPlayers}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl min-h-[120px] lg:min-h-[130px] flex items-center justify-center shadow-2xl">
          <CardContent className="p-5 text-center flex flex-col items-center justify-center gap-2">
            <div className="text-sm lg:text-lg font-bold text-slate-300">
              Aprovados
            </div>
            <div className="text-4xl lg:text-5xl font-black text-emerald-400">
              {stats.approvedPlayers}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl min-h-[120px] lg:min-h-[130px] flex items-center justify-center shadow-2xl">
          <CardContent className="p-5 text-center flex flex-col items-center justify-center gap-2">
            <div className="text-sm lg:text-lg font-bold text-slate-300">
              Pendentes
            </div>
            <div className="text-4xl lg:text-5xl font-black text-red-400">
              {stats.pendingPlayers}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl min-h-[120px] lg:min-h-[130px] flex items-center justify-center shadow-2xl">
          <CardContent className="p-5 text-center flex flex-col items-center justify-center gap-2">
            <div className="text-sm lg:text-lg font-bold text-slate-300">
              Completos
            </div>
            <div className="text-4xl lg:text-5xl font-black text-blue-400">
              {stats.activePlayers}
            </div>
          </CardContent>
        </Card>
      </div>

      {players.filter((player) => !player.is_admin && !player.approved).length >
        0 && (
        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl shadow-2xl">
          <CardContent className="p-4 space-y-3">
            <div>
              <h3 className="text-2xl font-black">Solicitações pendentes</h3>
              <p className="text-slate-300 text-sm">
                Aprove os participantes que solicitaram acesso ao bolão.
              </p>
            </div>

            <div className="space-y-3">
              {players
                .filter((player) => !player.is_admin && !player.approved)
                .map((player) => (
                  <div
                    key={player.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 shadow-lg"
                  >
                    <div>
                      <div className="font-bold text-lg">{player.name}</div>
                      <div className="text-slate-300 text-sm">
                        Celular: {player.access_code}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => onApprovePlayer(player.id)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl px-6"
                      >
                        Aprovar
                      </Button>

                      <Button
                        onClick={() => onRejectPlayer(player.id)}
                        className="bg-red-500 hover:bg-red-400 text-white font-black rounded-xl px-6"
                      >
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[28px] p-5 shadow-2xl">
        <div className="bg-gradient-to-r from-[#2A398D] to-slate-900 text-white text-center font-black text-base lg:text-lg py-4 tracking-wide rounded-2xl">
          RESULTADOS OFICIAIS - FASE DE GRUPOS
        </div>

        {sortedGames.map(renderGroupResultRow)}
      </div>

      <div className="space-y-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[28px] p-5 shadow-2xl">
        <div className="bg-gradient-to-r from-[#2A398D] to-slate-900 text-white text-center font-black text-base lg:text-lg py-4 tracking-wide rounded-2xl">
          RESULTADOS OFICIAIS - 16 AVOS DE FINAL
        </div>

        {round32Matches.map(renderKnockoutResultRow)}
      </div>
    </div>
  );
}