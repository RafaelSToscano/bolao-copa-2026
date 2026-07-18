"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";
import { FinalPrediction } from "@/services/supabase/finalPredictionsService";
import {
  tournamentResultService,
  TournamentResult,
  TournamentResultInput,
} from "@/services/supabase/tournamentResultService";
import { useAuth } from "@/hooks/useAuth";
import { useData } from "@/hooks/useData";
import { usePredictions } from "@/hooks/usePredictions";
import { usePhaseState } from "@/hooks/usePhaseState";
import { useStandings } from "@/hooks/useStandings";
import { useRanking } from "@/hooks/useRanking";
import { useAppStats } from "@/hooks/useAppStats";
import { Loader2 } from "lucide-react";
import { AuthForm } from "@/components/forms/AuthForm";
import { AppLayout } from "@/components/layouts/AppLayout";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { gamesService } from "@/services/supabase/gamesService";
import { playersService } from "@/services/supabase/playersService";
import { knockoutPredictionsService } from "@/services/supabase/knockoutPredictionsService";
import { evictDashboardCache } from "@/lib/evictDashboardCache";
import type { RandomPrediction } from "@/components/ui/random-predictor";
import { appSettingsService, AppSettings } from "@/services/supabase/appSettingsService";

type AppShellContextValue = {
  currentUser: Player;
  players: Player[];
  games: Game[];
  predictions: Prediction[];
  knockoutMatches: KnockoutMatchRecord[];
  knockoutPredictions: KnockoutPrediction[];
  finalPredictions: FinalPrediction[];
  tournamentResult: TournamentResult | null;
  appSettings: AppSettings | null;
  suspenseMode: boolean;
  drafts: ReturnType<typeof usePredictions>["drafts"];
  setDrafts: ReturnType<typeof usePredictions>["setDrafts"];
  saveSinglePrediction: ReturnType<typeof usePredictions>["saveSinglePrediction"];
  saveBatchPredictions: ReturnType<typeof usePredictions>["saveBatchPredictions"];
  clearPlayerPredictions: ReturnType<typeof usePredictions>["clearPlayerPredictions"];
  groupsLocked: boolean;
  allGroupStandings: ReturnType<typeof useStandings>["allGroupStandings"];
  bestThirdPlace: ReturnType<typeof useStandings>["bestThirdPlace"];
  qualifiedTeams: ReturnType<typeof useStandings>["qualifiedTeams"];
  ranking: ReturnType<typeof useRanking>["ranking"];
  positionChanges: ReturnType<typeof useRanking>["positionChanges"];
  stats: ReturnType<typeof useAppStats>;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  dataError: string | null;
  loadData: (options?: { force?: boolean }) => Promise<void>;
  logout: () => void;
  handleUpdateOfficialResult: (
    gameId: string,
    field: "official_score_a" | "official_score_b",
    value: string
  ) => Promise<void>;
  handleUpdateKnockoutOfficialResult: (
    matchId: number,
    scoreHome: number | null,
    scoreAway: number | null,
    winnerTeam?: string | null,
    homeTeam?: string | null,
    awayTeam?: string | null
  ) => Promise<void>;
  handleUpdateTournamentResult: (
    result: TournamentResultInput
  ) => Promise<void>;
  handleUpdateSuspenseMode: (enabled: boolean) => Promise<void>;
  handleApprovePlayer: (playerId: string) => Promise<void>;
  handleRejectPlayer: (playerId: string) => Promise<void>;
  handleApplySingleRandomPrediction: (
    randomPrediction: RandomPrediction
  ) => Promise<void>;
  handleClearPredictions: () => void;
};

export const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell() {
  const ctx = useContext(AppShellContext);
  if (!ctx) {
    throw new Error("useAppShell must be used inside <AppShell>");
  }
  return ctx;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    currentUser,
    isChecking,
    login,
    requestAccess,
    logout,
    error: authError,
  } = useAuth();

  const {
    players,
    games,
    predictions,
    knockoutMatches,
    knockoutPredictions,
    finalPredictions,
    tournamentResult,
    appSettings,
    loading: dataLoading,
    error: dataError,
    loadData,
    invalidateCache,
    setPlayers,
    setPredictions,
    setGames,
    setKnockoutMatches,
    setTournamentResult,
    setAppSettings,
  } = useData(currentUser?.id, {
    // Always request everyone's predictions once signed-in. The
    // server payload is identical across pages (backed by the 3h
    // base-data cache), so switching routes doesn't trigger a
    // refetch, and the client-side snapshot key stays stable.
    // Anonymous requests still get the own-predictions variant so
    // logged-out visitors don't pay the extra bytes.
    includeAllPredictions: Boolean(currentUser?.id),
    includePrivatePlayers: currentUser?.is_admin === true,
  });

  const setPredictionsAndInvalidate = useCallback<typeof setPredictions>(
    (updater) => {
      invalidateCache();
      setPredictions(updater);
    },
    [invalidateCache, setPredictions]
  );

  const {
    drafts,
    setDrafts,
    saveSinglePrediction,
    saveBatchPredictions,
    clearPlayerPredictions,
  } = usePredictions(
    currentUser?.id,
    games,
    predictions,
    setPredictionsAndInvalidate
  );

  const [message, setMessage] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { isGroupsLocked } = usePhaseState();
  const groupsLocked = isGroupsLocked();

  const { allGroupStandings, bestThirdPlace, qualifiedTeams } = useStandings(
    games,
    predictions
  );

  const { ranking, positionChanges } = useRanking(
    players,
    games,
    predictions,
    knockoutMatches,
    knockoutPredictions,
    finalPredictions,
    tournamentResult
  );

  const stats = useAppStats(
    players,
    games,
    predictions,
    currentUser?.id,
    knockoutMatches,
    knockoutPredictions
  );

  useEffect(() => {
    if (!currentUser?.id) return;

  // Load once when the user is known. We deliberately do NOT retrigger
  // on route change — the bootstrap payload is identical for every
  // page inside AppShell, and the 60s client TTL + 3h server TTL make
  // extra fetches wasted work.
    void loadData();
  }, [currentUser?.id, loadData]);

  const handleLogin = async (accessCode: string, password: string) => {
    const success = await login(accessCode, password);
    if (!success) return;
    try {
      const savedUser = localStorage.getItem("bolao_user");
      if (savedUser) JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("bolao_user");
    }
    // Do NOT call loadData() here: `loadData` is the closure captured
    // when currentUser was still undefined, so its fetch would hit
    // /api/bootstrap without a userId and receive an empty predictions
    // payload. The effect on line 173 fires on the next render (once
    // currentUser?.id resolves) and runs a userId-scoped fetch.
  };

  const handleRequestAccess = async (
    name: string,
    accessCode: string,
    password: string
  ): Promise<void> => {
    await requestAccess(name, accessCode, password);
  };

  const handleUpdateOfficialResult = async (
    gameId: string,
    field: "official_score_a" | "official_score_b",
    value: string
  ) => {
    try {
      const parsed = value === "" ? null : Number(value);

      await gamesService.updateOfficialResult(gameId, field, parsed);

      const nextGames = games.map((game) =>
        game.id === gameId
          ? {
              ...game,
              [field]: parsed,
            }
          : game
      );

      invalidateCache();
      setGames(() => nextGames);

      const updatedKnockoutMatches =
        await knockoutPredictionsService.syncRound32FromGroups(nextGames);

      setKnockoutMatches(updatedKnockoutMatches);

      evictDashboardCache(currentUser?.id);

      window.dispatchEvent(new Event("knockout-matches-updated"));

      setMessage("Resultado atualizado com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Erro ao atualizar resultado."
      );
    }
  };

  const handleUpdateKnockoutOfficialResult = async (
    matchId: number,
    scoreHome: number | null,
    scoreAway: number | null,
    winnerTeam?: string | null,
    homeTeam?: string | null,
    awayTeam?: string | null
  ) => {
    try {
      if (homeTeam && awayTeam) {
        await knockoutPredictionsService.updateKnockoutMatchTeams(
          matchId,
          homeTeam,
          awayTeam
        );
      }

      await knockoutPredictionsService.updateKnockoutMatchResult(
        matchId,
        scoreHome,
        scoreAway,
        winnerTeam ?? null
      );

      invalidateCache();

      const updatedMatches = await knockoutPredictionsService.getKnockoutMatches();
      setKnockoutMatches(updatedMatches);

      evictDashboardCache(currentUser?.id);

      window.dispatchEvent(new Event("knockout-matches-updated"));

      setMessage("Resultado atualizado com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Erro ao atualizar resultado do mata-mata."
      );
    }
  };

  const handleUpdateTournamentResult = async (
    result: TournamentResultInput
  ) => {
    try {
      const updatedResult = await tournamentResultService.update(result);

      invalidateCache();
      setTournamentResult(updatedResult);
      evictDashboardCache(currentUser?.id);

      setMessage("Classificação final atualizada com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao atualizar a classificação final.";
      setMessage(message);
      throw err;
    }
  };

  const handleUpdateSuspenseMode = async (enabled: boolean) => {
    try {
      const updatedSettings = await appSettingsService.updateSuspenseMode(enabled);
      setAppSettings(updatedSettings);
      invalidateCache();
      setMessage(
        enabled
          ? "Modo Suspense ativado para os participantes."
          : "Modo Suspense desativado. O resultado foi revelado."
      );
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      const nextMessage =
        err instanceof Error
          ? err.message
          : "Erro ao atualizar o Modo Suspense.";
      setMessage(nextMessage);
      throw err;
    }
  };

  const handleApplySingleRandomPrediction = async (
    randomPrediction: RandomPrediction
  ) => {
    if (!currentUser) return;

    try {
      const updatedPrediction = {
        player_id: currentUser.id,
        game_id: randomPrediction.game_id,
        predicted_score_a: randomPrediction.predicted_score_a,
        predicted_score_b: randomPrediction.predicted_score_b,
      };

      setDrafts((prev) => ({
        ...prev,
        [randomPrediction.game_id]: {
          predicted_score_a: String(randomPrediction.predicted_score_a),
          predicted_score_b: String(randomPrediction.predicted_score_b),
        },
      }));

      await saveBatchPredictions([updatedPrediction]);
    } catch (err) {
      console.error("Failed to apply single random prediction:", err);
    }
  };

  const handleApprovePlayer = async (playerId: string) => {
    await playersService.approvePlayer(playerId);
    // Optimistic local update — avoids an immediate re-hydration
    // round-trip after the server evict. The next natural refetch
    // (from any viewer, including this tab on next mount) will
    // rebuild the server cache once from Supabase.
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, approved: true } : p))
    );
    invalidateCache();
    evictDashboardCache(currentUser?.id);
  };

  const handleRejectPlayer = async (playerId: string) => {
    await playersService.rejectPlayer(playerId);
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    invalidateCache();
    evictDashboardCache(currentUser?.id);
  };

  const handleClearPredictions = () => {
    if (groupsLocked) return;
    setShowClearConfirm(true);
  };

  const handleClearConfirmed = async () => {
    setShowClearConfirm(false);
    await clearPlayerPredictions();
    setMessage("Seus palpites foram apagados com sucesso.");
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-pulse text-xl font-semibold">
          Carregando Bolão Copa 2026...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthForm
        onLogin={handleLogin}
        onRequestAccess={handleRequestAccess}
        onRefresh={loadData}
        error={authError}
        isLoading={dataLoading}
      />
    );
  }

  const value: AppShellContextValue = {
    currentUser,
    players,
    games,
    predictions,
    knockoutMatches,
    knockoutPredictions,
    finalPredictions,
    tournamentResult,
    appSettings,
    suspenseMode: appSettings?.suspense_mode === true,
    drafts,
    setDrafts,
    saveSinglePrediction,
    saveBatchPredictions,
    clearPlayerPredictions,
    groupsLocked,
    allGroupStandings,
    bestThirdPlace,
    qualifiedTeams,
    ranking,
    positionChanges,
    stats,
    message,
    setMessage,
    dataError,
    loadData,
    logout,
    handleUpdateOfficialResult,
    handleUpdateKnockoutOfficialResult,
    handleUpdateTournamentResult,
    handleUpdateSuspenseMode,
    handleApprovePlayer,
    handleRejectPlayer,
    handleApplySingleRandomPrediction,
    handleClearPredictions,
  };

  return (
    <AppShellContext.Provider value={value}>
      <AppLayout
        currentUser={currentUser}
        onLogout={logout}
        userCompletion={stats.userCompletion}
        suspenseMode={appSettings?.suspense_mode === true}
        suspenseMessage={appSettings?.suspense_message}
      >
        {(dataError || message) && (
          <div
            className={`rounded-2xl border p-4 text-sm ${
              dataError
                ? "bg-slate-900 border-slate-800 text-yellow-400"
                : "bg-emerald-900/20 border-emerald-800 text-emerald-400"
            }`}
          >
            {dataError || message}
          </div>
        )}
        {dataLoading && players.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
            <Loader2 size={28} className="animate-spin" />
            <span className="text-sm font-semibold">Carregando...</span>
          </div>
        ) : (
          children
        )}
      </AppLayout>

      {showClearConfirm && (
        <ConfirmModal
          title="Apagar palpites"
          message="Tem certeza que deseja apagar todos os seus palpites? Esta ação não pode ser desfeita."
          confirmLabel="Apagar tudo"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={handleClearConfirmed}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </AppShellContext.Provider>
  );
}