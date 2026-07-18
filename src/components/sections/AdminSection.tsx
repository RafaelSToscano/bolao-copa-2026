"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  buildDisplayKnockoutMatches,
  type DisplayKnockoutMatch,
} from "@/lib/knockoutDisplayMatches";
import {
  formatKnockoutStageSectionTitle,
  sortKnockoutMatchesByDateAndNumber,
} from "@/lib/knockoutVisibility";
import {
  isKnockoutMatchPredictionLocked,
  isPredictableKnockoutRound,
} from "@/config/knockout";
import { Share2, List, Eye, EyeOff } from "lucide-react";
import type { TournamentResult, TournamentResultInput } from "@/services/supabase/tournamentResultService";

const SEMIFINALISTS = ["França", "Espanha", "Inglaterra", "Argentina"] as const;

type Semifinalist = (typeof SEMIFINALISTS)[number];

type FinalResultDraft = {
  champion: Semifinalist | "";
  runner_up: Semifinalist | "";
  third_place: Semifinalist | "";
};

function getFinalResultSignature(result: {
  champion: string | null | "";
  runner_up: string | null | "";
  third_place: string | null | "";
}) {
  return [result.champion ?? "", result.runner_up ?? "", result.third_place ?? ""].join("|");
}

interface AdminSectionProps {
  games: Game[];
  predictions: Prediction[];
  knockoutMatches: KnockoutMatchRecord[];
  knockoutPredictions: KnockoutPrediction[];
  players: Player[];
  ranking: (Player & { total: number; exacts: number; position: number })[];
  tournamentResult?: TournamentResult | null;
  suspenseMode?: boolean;
  suspenseMessage?: string | null;
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
  onUpdateTournamentResult?: (
    result: TournamentResultInput
  ) => Promise<void>;
  onUpdateSuspenseMode?: (enabled: boolean) => Promise<void>;
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
  tournamentResult = null,
  suspenseMode = false,
  suspenseMessage = null,
  onUpdateResult,
  onUpdateKnockoutResult,
  onUpdateTournamentResult = async () => {},
  onUpdateSuspenseMode = async () => {},
  onApprovePlayer,
  onRejectPlayer,
}: AdminSectionProps) {
  const [shareMode, setShareMode] = useState<"highlight" | "full" | null>(null);
  const [isUpdatingSuspense, setIsUpdatingSuspense] = useState(false);
  const [isSavingFinalResult, setIsSavingFinalResult] = useState(false);
  const [finalResultStatus, setFinalResultStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [finalResultError, setFinalResultError] = useState<string | null>(null);
  const finalResultRequestSignatureRef = useRef<string | null>(null);
  const [finalResultDraft, setFinalResultDraft] = useState<FinalResultDraft>({
    champion: "",
    runner_up: "",
    third_place: "",
  });

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

  const displayKnockoutMatches = useMemo(
    () => buildDisplayKnockoutMatches(knockoutMatches, games),
    [knockoutMatches, games]
  );

  const adminKnockoutMatches = useMemo(
    () =>
      sortKnockoutMatchesByDateAndNumber(
        displayKnockoutMatches.filter((match) =>
          isPredictableKnockoutRound(match.round)
        )
      ),
    [displayKnockoutMatches]
  );

  const semifinalKnockoutMatches = useMemo(
    () => adminKnockoutMatches.filter((match) => match.round === "sf"),
    [adminKnockoutMatches]
  );

  const isFinalRound = (round: string) =>
    round === "final" || round === "f";

  const isThirdPlaceRound = (round: string) =>
    round === "third_place" || round === "3rd";

  const finalKnockoutMatches = useMemo(
    () => adminKnockoutMatches.filter((match) => isFinalRound(match.round)),
    [adminKnockoutMatches]
  );

  const thirdPlaceKnockoutMatches = useMemo(
    () =>
      adminKnockoutMatches.filter((match) =>
        isThirdPlaceRound(match.round)
      ),
    [adminKnockoutMatches]
  );

  const previousAdminKnockoutMatches = useMemo(
    () =>
      adminKnockoutMatches.filter(
        (match) =>
          match.round !== "sf" &&
          !isFinalRound(match.round) &&
          !isThirdPlaceRound(match.round)
      ),
    [adminKnockoutMatches]
  );

  useEffect(() => {
    const persistedDraft: FinalResultDraft = {
      champion: (tournamentResult?.champion as Semifinalist | null) ?? "",
      runner_up: (tournamentResult?.runner_up as Semifinalist | null) ?? "",
      third_place: (tournamentResult?.third_place as Semifinalist | null) ?? "",
    };

    setFinalResultDraft(persistedDraft);
    finalResultRequestSignatureRef.current = getFinalResultSignature(persistedDraft);
    setFinalResultError(null);
    setFinalResultStatus("idle");
  }, [tournamentResult]);

  const selectedFinalists = [
    finalResultDraft.champion,
    finalResultDraft.runner_up,
    finalResultDraft.third_place,
  ].filter(Boolean) as Semifinalist[];

  const hasDuplicateFinalists =
    new Set(selectedFinalists).size !== selectedFinalists.length;

  const fourthPlace =
    SEMIFINALISTS.find((team) => !selectedFinalists.includes(team)) ?? null;

  const isFinalResultComplete =
    Boolean(finalResultDraft.champion) &&
    Boolean(finalResultDraft.runner_up) &&
    Boolean(finalResultDraft.third_place) &&
    !hasDuplicateFinalists;

  const isFinalResultEmpty =
    !finalResultDraft.champion &&
    !finalResultDraft.runner_up &&
    !finalResultDraft.third_place;

  const hasPersistedFinalResult = Boolean(
    tournamentResult?.champion ||
      tournamentResult?.runner_up ||
      tournamentResult?.third_place
  );

  const hasFinalResultChanges =
    finalResultDraft.champion !== (tournamentResult?.champion ?? "") ||
    finalResultDraft.runner_up !== (tournamentResult?.runner_up ?? "") ||
    finalResultDraft.third_place !== (tournamentResult?.third_place ?? "");

  useEffect(() => {
    if (hasDuplicateFinalists) {
      setFinalResultStatus("error");
      setFinalResultError("A mesma seleção não pode ocupar mais de uma posição.");
      return;
    }

    if (!hasFinalResultChanges) {
      setFinalResultError(null);
      setFinalResultStatus(hasPersistedFinalResult ? "saved" : "idle");
      return;
    }

    const shouldSaveComplete = isFinalResultComplete;
    const shouldClearPersisted = isFinalResultEmpty && hasPersistedFinalResult;

    if (!shouldSaveComplete && !shouldClearPersisted) {
      setFinalResultError(null);
      setFinalResultStatus("idle");
      return;
    }

    const signature = getFinalResultSignature(finalResultDraft);

    if (finalResultRequestSignatureRef.current === signature) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setIsSavingFinalResult(true);
        setFinalResultStatus("saving");
        setFinalResultError(null);
        finalResultRequestSignatureRef.current = signature;

        if (shouldSaveComplete) {
          await onUpdateTournamentResult({
            champion: finalResultDraft.champion || null,
            runner_up: finalResultDraft.runner_up || null,
            third_place: finalResultDraft.third_place || null,
          } as TournamentResultInput);
        } else {
          await onUpdateTournamentResult({
            champion: null,
            runner_up: null,
            third_place: null,
          } as TournamentResultInput);
        }

        setFinalResultStatus("saved");
      } catch (error) {
        console.error(error);
        finalResultRequestSignatureRef.current = null;
        setFinalResultStatus("error");
        setFinalResultError("Não foi possível salvar a classificação final.");
      } finally {
        setIsSavingFinalResult(false);
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [
    finalResultDraft,
    hasDuplicateFinalists,
    hasFinalResultChanges,
    hasPersistedFinalResult,
    isFinalResultComplete,
    isFinalResultEmpty,
    onUpdateTournamentResult,
  ]);

  const knockoutAuditMatches = useMemo(
    () =>
      sortKnockoutMatchesByDateAndNumber(
        displayKnockoutMatches.filter(
          (match) => match.display_home_team && match.display_away_team
        )
      ),
    [displayKnockoutMatches]
  );

  const predictionAuditScope = useMemo(() => {
    const approvedPlayers = players.filter(
      (player) => player.approved && !player.is_admin
    );

    const availableKnockoutMatches = sortKnockoutMatchesByDateAndNumber(
      displayKnockoutMatches.filter(
        (match) =>
          isPredictableKnockoutRound(match.round) &&
          Boolean(match.display_home_team) &&
          Boolean(match.display_away_team) &&
          !isKnockoutMatchPredictionLocked(match)
      )
    );

    const availableGroupGames = games.filter((game) => !game.locked);

    if (availableKnockoutMatches.length > 0) {
      const audit = approvedPlayers
        .map((player) => {
          const missingMatches = availableKnockoutMatches.filter((match) => {
            const prediction = knockoutPredictions.find(
              (item) =>
                item.player_id === player.id && item.match_id === match.id
            );

            return (
              !prediction ||
              prediction.predicted_score_home === null ||
              prediction.predicted_score_away === null
            );
          });

          const total = availableKnockoutMatches.length;
          const completed = total - missingMatches.length;

          return {
            player,
            total,
            completed,
            pending: missingMatches.length,
            completion: total > 0 ? Math.round((completed / total) * 100) : 0,
            missingGames: missingMatches.map(
              (match) =>
                `${match.display_home_team} x ${match.display_away_team}`
            ),
          };
        })
        .sort((a, b) => {
          if (a.pending !== b.pending) return b.pending - a.pending;
          return a.player.name.localeCompare(b.player.name);
        });

      return {
        totalGames: availableKnockoutMatches.length,
        totalPlayers: approvedPlayers.length,
        audit,
      };
    }

    const audit = approvedPlayers
      .map((player) => {
        const missingGames = availableGroupGames.filter((game) => {
          const prediction = predictions.find(
            (item) => item.player_id === player.id && item.game_id === game.id
          );

          return (
            !prediction ||
            prediction.predicted_score_a === null ||
            prediction.predicted_score_b === null
          );
        });

        const total = availableGroupGames.length;
        const completed = total - missingGames.length;

        return {
          player,
          total,
          completed,
          pending: missingGames.length,
          completion: total > 0 ? Math.round((completed / total) * 100) : 0,
          missingGames: missingGames.map(
            (game) => `${game.team_a} x ${game.team_b}`
          ),
        };
      })
      .sort((a, b) => {
        if (a.pending !== b.pending) return b.pending - a.pending;
        return a.player.name.localeCompare(b.player.name);
      });

    return {
      totalGames: availableGroupGames.length,
      totalPlayers: approvedPlayers.length,
      audit,
    };
  }, [
    players,
    games,
    predictions,
    displayKnockoutMatches,
    knockoutPredictions,
  ]);

  const incompletePredictionPlayers = predictionAuditScope.audit.filter(
    (item) => item.pending > 0
  );

  const completedPredictionPlayers = predictionAuditScope.audit.filter(
    (item) => item.total > 0 && item.pending === 0
  ).length;

  const completionRate =
    predictionAuditScope.totalPlayers > 0
      ? Math.round(
          (completedPredictionPlayers / predictionAuditScope.totalPlayers) * 100
        )
      : 0;

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

  const getKnockoutDraft = (match: DisplayKnockoutMatch) =>
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
    match: DisplayKnockoutMatch,
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
    match: DisplayKnockoutMatch,
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
      "Fase",
      "Jogo",
      "Data",
      "Mandante",
      "Visitante",
      "Palpite mandante",
      "Palpite visitante",
      "Vencedor previsto",
      "Status",
    ];

    const approvedPlayers = players
      .filter((player) => player.approved && !player.is_admin)
      .sort((a, b) => a.name.localeCompare(b.name));

    const displayById = new Map(
      displayKnockoutMatches.map((match) => [match.id, match])
    );

    const matches = [...knockoutMatches]
      .filter((match) => {
        if (!isPredictableKnockoutRound(match.round)) return false;

        const displayMatch = displayById.get(match.id);
        const homeTeam = displayMatch?.display_home_team ?? match.home_team;
        const awayTeam = displayMatch?.display_away_team ?? match.away_team;

        return Boolean(homeTeam && awayTeam);
      })
      .sort((a, b) => {
        const dateA = a.match_date
          ? new Date(a.match_date).getTime()
          : Number.MAX_SAFE_INTEGER;
        const dateB = b.match_date
          ? new Date(b.match_date).getTime()
          : Number.MAX_SAFE_INTEGER;

        if (dateA !== dateB) return dateA - dateB;

        return (a.match_number ?? a.id) - (b.match_number ?? b.id);
      });

    const rows = approvedPlayers.flatMap((player) =>
      matches.map((match) => {
        const displayMatch = displayById.get(match.id);
        const homeTeam = displayMatch?.display_home_team ?? match.home_team ?? "";
        const awayTeam = displayMatch?.display_away_team ?? match.away_team ?? "";

        const prediction = knockoutPredictions.find(
          (item) => item.player_id === player.id && item.match_id === match.id
        );

        const hasPrediction =
          prediction?.predicted_score_home !== null &&
          prediction?.predicted_score_home !== undefined &&
          prediction?.predicted_score_away !== null &&
          prediction?.predicted_score_away !== undefined;

        return [
          player.name,
          formatKnockoutStageSectionTitle(match.round),
          match.match_number ?? match.id,
          formatDate(match.match_date),
          homeTeam,
          awayTeam,
          prediction?.predicted_score_home ?? "",
          prediction?.predicted_score_away ?? "",
          prediction?.predicted_winner ?? "",
          hasPrediction ? "Preenchido" : "Pendente",
        ];
      })
    );

    const escapeCsv = (value: string | number | null | undefined) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "auditoria-palpites-mata-mata-detalhada.csv";
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

  const renderKnockoutResultRow = (match: DisplayKnockoutMatch) => {
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
            Classificado:
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

  const incompletePredictionsCard = (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl shadow-2xl">
      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="text-2xl font-black">
            Jogadores com palpites incompletos
          </h3>
        </div>

        {incompletePredictionPlayers.length === 0 ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-300">
            Todos os participantes preencheram os palpites disponíveis.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-950 text-slate-300">
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-center font-black">#</th>
                  <th className="px-4 py-3 text-left font-black">Jogador</th>
                  <th className="px-4 py-3 text-center font-black">Palpitados</th>
                  <th className="px-4 py-3 text-center font-black">Pendentes</th>
                  <th className="px-4 py-3 text-center font-black">%</th>
                  <th className="px-4 py-3 text-left font-black">Faltam</th>
                </tr>
              </thead>
              <tbody>
                {incompletePredictionPlayers.map((item, index) => (
                  <tr
                    key={item.player.id}
                    className="border-b border-slate-800 bg-slate-950/60 last:border-b-0"
                  >
                    <td className="px-4 py-3 text-center font-black text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      {item.player.name}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-emerald-400">
                      {item.completed}/{item.total}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-red-400">
                      {item.pending}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-blue-400">
                      {item.completion}%
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {item.missingGames.slice(0, 4).join(" | ")}
                      {item.missingGames.length > 4
                        ? ` | +${item.missingGames.length - 4}`
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const handleSuspenseToggle = async () => {
    const nextEnabled = !suspenseMode;
    const confirmed = window.confirm(
      nextEnabled
        ? "Ativar o Modo Suspense? Ranking, histórico, simulador e classificação serão ocultados para os participantes."
        : "Revelar o resultado? As áreas bloqueadas voltarão a ficar visíveis imediatamente para todos."
    );

    if (!confirmed) return;

    try {
      setIsUpdatingSuspense(true);
      await onUpdateSuspenseMode(nextEnabled);
    } finally {
      setIsUpdatingSuspense(false);
    }
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

      <Card className={`rounded-3xl border text-white shadow-2xl ${
        suspenseMode
          ? "border-red-400/30 bg-gradient-to-br from-red-950/70 to-slate-950"
          : "border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950"
      }`}>
        <CardContent className="p-5 lg:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                suspenseMode
                  ? "border-red-400/30 bg-red-400/10 text-red-300"
                  : "border-yellow-400/30 bg-yellow-400/10 text-yellow-300"
              }`}>
                {suspenseMode ? <EyeOff size={24} /> : <Eye size={24} />}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-2xl font-black">Modo Suspense</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                    suspenseMode
                      ? "bg-red-400/15 text-red-300"
                      : "bg-emerald-400/15 text-emerald-300"
                  }`}>
                    {suspenseMode ? "Ativado" : "Desativado"}
                  </span>
                </div>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-slate-300">
                  {suspenseMode
                    ? suspenseMessage || "Ranking, histórico, simulador e classificação estão ocultos para os participantes. Palpites e Palpites da Galera seguem disponíveis."
                    : "Ao ativar, as áreas que revelam a classificação ficam ocultas para os participantes. Administradores continuam vendo tudo normalmente."}
                </p>
              </div>
            </div>

            <Button
              onClick={handleSuspenseToggle}
              disabled={isUpdatingSuspense}
              className={`h-12 min-w-[230px] rounded-2xl font-black ${
                suspenseMode
                  ? "bg-yellow-400 text-slate-950 hover:bg-yellow-300"
                  : "bg-red-600 text-white hover:bg-red-500"
              }`}
            >
              {isUpdatingSuspense
                ? "Atualizando..."
                : suspenseMode
                  ? "Desativar e revelar resultado"
                  : "Ativar Modo Suspense"}
            </Button>
          </div>
        </CardContent>
      </Card>

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
              {predictionAuditScope.totalPlayers}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl min-h-[120px] lg:min-h-[130px] flex items-center justify-center shadow-2xl">
          <CardContent className="p-5 text-center flex flex-col items-center justify-center gap-2">
            <div className="text-sm lg:text-lg font-bold text-slate-300">
              Completos
            </div>
            <div className="text-4xl lg:text-5xl font-black text-emerald-400">
              {completedPredictionPlayers}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl min-h-[120px] lg:min-h-[130px] flex items-center justify-center shadow-2xl">
          <CardContent className="p-5 text-center flex flex-col items-center justify-center gap-2">
            <div className="text-sm lg:text-lg font-bold text-slate-300">
              Incompletos
            </div>
            <div className="text-4xl lg:text-5xl font-black text-red-400">
              {incompletePredictionPlayers.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl min-h-[120px] lg:min-h-[130px] flex items-center justify-center shadow-2xl">
          <CardContent className="p-5 text-center flex flex-col items-center justify-center gap-2">
            <div className="text-sm lg:text-lg font-bold text-slate-300">
              Conclusão
            </div>
            <div className="text-4xl lg:text-5xl font-black text-blue-400">
              {completionRate}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[28px] p-5 lg:p-6 shadow-2xl">
        <div className="bg-gradient-to-r from-[#2A398D] via-blue-900 to-slate-900 text-white rounded-2xl p-5 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-200">
                Encerramento do torneio
              </div>
              <h3 className="mt-2 text-2xl lg:text-3xl font-black tracking-tight">
                🏆 Reta Final da Copa
              </h3>
              <p className="mt-2 text-sm lg:text-base font-semibold text-slate-200">
                Lance os resultados decisivos e, em seguida, confirme a classificação final.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-slate-950/30 px-4 py-3 text-sm font-bold text-slate-200">
              Fluxo: 3º lugar → Final → Classificação
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-400/30 bg-orange-400/10 text-xl">
              🥉
            </div>
            <div>
              <h4 className="text-xl lg:text-2xl font-black text-white">
                Disputa de 3º lugar
              </h4>
              <p className="text-sm font-semibold text-slate-400">
                Preencha primeiro o resultado que define o terceiro colocado.
              </p>
            </div>
          </div>

          {thirdPlaceKnockoutMatches.length > 0 ? (
            thirdPlaceKnockoutMatches.map(renderKnockoutResultRow)
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm font-bold text-slate-500">
              A disputa de 3º lugar ainda não está disponível.
            </div>
          )}
        </div>

        <div className="h-px bg-slate-800" />

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-yellow-400/30 bg-yellow-400/10 text-xl">
              🏆
            </div>
            <div>
              <h4 className="text-xl lg:text-2xl font-black text-white">
                Final
              </h4>
              <p className="text-sm font-semibold text-slate-400">
                Lance o placar oficial da decisão do título.
              </p>
            </div>
          </div>

          {finalKnockoutMatches.length > 0 ? (
            finalKnockoutMatches.map(renderKnockoutResultRow)
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm font-bold text-slate-500">
              A final ainda não está disponível.
            </div>
          )}
        </div>

        <div className="h-px bg-slate-800" />

        <div className="space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.25em] text-yellow-300">
                Etapa final
              </div>
              <h4 className="mt-2 text-2xl lg:text-3xl font-black tracking-tight text-white">
                🥇 Classificação final da Copa
              </h4>
              <p className="text-slate-300 text-sm lg:text-base mt-2 font-semibold">
                Defina as posições oficiais para aplicar os pontos dos palpites finais.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs lg:text-sm font-black">
              <span className="rounded-full bg-yellow-400/15 border border-yellow-400/30 px-4 py-2 text-yellow-300">
                Campeão: 40 pts
              </span>
              <span className="rounded-full bg-slate-300/10 border border-slate-400/30 px-4 py-2 text-slate-200">
                Vice: 25 pts
              </span>
              <span className="rounded-full bg-orange-400/10 border border-orange-400/30 px-4 py-2 text-orange-300">
                Terceiro: 15 pts
              </span>
            </div>
          </div>

          {selectedFinalists.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(
                [
                  ["champion", "🏆", "Campeão"],
                  ["runner_up", "🥈", "Vice-campeão"],
                  ["third_place", "🥉", "Terceiro colocado"],
                ] as const
              ).map(([field, medal, label]) => {
                const team = finalResultDraft[field];

                return (
                  <div
                    key={`summary-${field}`}
                    className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3"
                  >
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                      {medal} {label}
                    </div>
                    <div className="mt-2 flex items-center gap-2 font-black text-white">
                      {team ? (
                        <>
                          <Flag team={team} />
                          {team}
                        </>
                      ) : (
                        <span className="text-slate-600">A definir</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(
              [
                ["champion", "Campeão", "40 pontos"],
                ["runner_up", "Vice-campeão", "25 pontos"],
                ["third_place", "Terceiro colocado", "15 pontos"],
              ] as const
            ).map(([field, label, points]) => {
              const selectedTeam = finalResultDraft[field];

              return (
                <div
                  key={field}
                  className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-black text-xl lg:text-2xl leading-tight">
                        {label}
                      </div>
                      <div className="text-xs lg:text-sm font-bold text-slate-400 mt-1">
                        {points}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setFinalResultDraft((previous) => ({
                          ...previous,
                          [field]: "",
                        }))
                      }
                      disabled={!selectedTeam || isSavingFinalResult}
                      className="border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white font-black disabled:opacity-40"
                    >
                      Limpar
                    </Button>
                  </div>

                  <select
                    value={selectedTeam}
                    onChange={(event) =>
                      setFinalResultDraft((previous) => ({
                        ...previous,
                        [field]: event.target.value as Semifinalist | "",
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-[#2A398D] bg-slate-950 px-4 text-sm lg:text-base font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Nenhum / limpar seleção --</option>
                    {SEMIFINALISTS.map((team) => {
                      const selectedElsewhere =
                        team !== selectedTeam && selectedFinalists.includes(team);

                      return (
                        <option key={team} value={team} disabled={selectedElsewhere}>
                          {team}
                        </option>
                      );
                    })}
                  </select>

                  {selectedTeam ? (
                    <div className="flex items-center gap-2 text-sm lg:text-base font-black text-slate-200">
                      <Flag team={selectedTeam} />
                      {selectedTeam}
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-slate-500">
                      Nenhuma seleção escolhida.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-black uppercase tracking-widest text-slate-400">
                  Quarto colocado automático
                </div>
                {fourthPlace && isFinalResultComplete ? (
                  <div className="mt-3 flex items-center gap-2 text-base lg:text-lg font-black text-white">
                    <Flag team={fourthPlace} />
                    {fourthPlace}
                    <span className="text-sm font-bold text-slate-500">sem pontuação</span>
                  </div>
                ) : (
                  <div className="mt-3 text-sm lg:text-base font-bold text-slate-500">
                    Será definido pela seleção restante quando os três campos forem preenchidos.
                  </div>
                )}
              </div>

              {hasDuplicateFinalists && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-300">
                  A mesma seleção não pode ocupar mais de uma posição.
                </div>
              )}

              {finalResultError && !hasDuplicateFinalists && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-300">
                  {finalResultError}
                </div>
              )}
            </div>

            <div className="min-w-[260px] rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-left lg:text-right">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Salvamento automático
              </div>
              <div className="mt-2 text-sm lg:text-base font-bold text-slate-200">
                {hasDuplicateFinalists
                  ? "Corrija as seleções repetidas para continuar."
                  : isSavingFinalResult || finalResultStatus === "saving"
                    ? "Salvando alterações..."
                    : isFinalResultComplete && !hasFinalResultChanges
                      ? "Classificação salva automaticamente."
                      : isFinalResultEmpty && !hasPersistedFinalResult
                        ? "Nenhuma classificação final salva."
                        : isFinalResultEmpty && hasPersistedFinalResult
                          ? "Apagando classificação salva..."
                          : "Preencha os 3 campos para salvar automaticamente."}
              </div>
            </div>
          </div>
        </div>

        {semifinalKnockoutMatches.length > 0 && (
          <details className="group rounded-2xl border border-slate-800 bg-slate-950/50">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-black text-slate-300 hover:text-white">
              <span>Semifinais concluídas — consultar resultados</span>
              <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-open:hidden">
                Exibir
              </span>
              <span className="hidden text-xs font-black uppercase tracking-widest text-slate-500 group-open:inline">
                Ocultar
              </span>
            </summary>

            <div className="space-y-3 border-t border-slate-800 p-4">
              {semifinalKnockoutMatches.map(renderKnockoutResultRow)}
            </div>
          </details>
        )}
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

      {previousAdminKnockoutMatches.length > 0 && (
        <details className="group rounded-[28px] border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-black text-slate-300 hover:text-white">
            <span>Resultados anteriores do mata-mata</span>
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-open:hidden">
              Exibir
            </span>
            <span className="hidden text-xs font-black uppercase tracking-widest text-slate-500 group-open:inline">
              Ocultar
            </span>
          </summary>

          <div className="space-y-3 border-t border-slate-800 p-5">
            {previousAdminKnockoutMatches.map(renderKnockoutResultRow)}
          </div>
        </details>
      )}

      {incompletePredictionsCard}

      <div className="space-y-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[28px] p-5 shadow-2xl">
        <div className="bg-gradient-to-r from-[#2A398D] to-slate-900 text-white text-center font-black text-base lg:text-lg py-4 tracking-wide rounded-2xl">
          RESULTADOS OFICIAIS - FASE DE GRUPOS
        </div>

        {sortedGames.map(renderGroupResultRow)}
      </div>
    </div>
  );
}
