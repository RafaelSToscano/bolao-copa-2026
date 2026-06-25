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
import { useAuth } from "@/hooks/useAuth";
import { useData } from "@/hooks/useData";
import { usePredictions } from "@/hooks/usePredictions";
import { usePhaseState } from "@/hooks/usePhaseState";
import { useStandings } from "@/hooks/useStandings";
import { useRanking } from "@/hooks/useRanking";
import { useAppStats } from "@/hooks/useAppStats";
import { AuthForm } from "@/components/forms/AuthForm";
import { AppLayout } from "@/components/layouts/AppLayout";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { gamesService } from "@/services/supabase/gamesService";
import { playersService } from "@/services/supabase/playersService";
import type { RandomPrediction } from "@/components/ui/random-predictor";

type AppShellContextValue = {
  currentUser: Player;
  players: Player[];
  games: Game[];
  predictions: Prediction[];
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
  loadData: () => Promise<void>;
  logout: () => void;
  handleUpdateOfficialResult: (
    gameId: string,
    field: "official_score_a" | "official_score_b",
    value: string
  ) => Promise<void>;
  handleApprovePlayer: (playerId: string) => Promise<void>;
  handleRejectPlayer: (playerId: string) => Promise<void>;
  handleApplySingleRandomPrediction: (
    randomPrediction: RandomPrediction
  ) => Promise<void>;
  handleClearPredictions: () => void;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

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
    loading: dataLoading,
    error: dataError,
    loadData,
    invalidateCache,
    setPredictions,
    setGames,
  } = useData();

  // Wrap each prediction mutation so the sessionStorage snapshot is
  // evicted before useData's optimistic state update — that way a
  // navigation in the next ~60s revalidates against supabase instead
  // of serving the now-stale snapshot.
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
  const { ranking, positionChanges } = useRanking(players, games, predictions);
  const stats = useAppStats(players, games, predictions, currentUser?.id);

   // Refresh only when the authenticated user changes. Route changes
  // should reuse the AppShell context data instead of refetching
  // players, games and predictions on every tab switch.
  useEffect(() => {
    if (currentUser?.id) {
      loadData();
    }
  }, [currentUser?.id, loadData]);

  const handleLogin = async (accessCode: string, password: string) => {
    const success = await login(accessCode, password);
    if (success) {
      try {
        const savedUser = localStorage.getItem("bolao_user");
        if (savedUser) JSON.parse(savedUser);
      } catch {
        localStorage.removeItem("bolao_user");
      }
      await loadData();
    }
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

      invalidateCache();
      setGames((prev) =>
        prev.map((g) =>
          g.id === gameId
            ? {
                ...g,
                [field]: parsed,
              }
            : g
        )
      );

      if (currentUser?.id) {
        void fetch("/api/dashboard/cache/evict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id }),
        }).catch(() => {});
      }

      setMessage("Resultado atualizado com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Erro ao atualizar resultado."
      );
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
    invalidateCache();
    await loadData();
  };

  const handleRejectPlayer = async (playerId: string) => {
    await playersService.rejectPlayer(playerId);
    invalidateCache();
    await loadData();
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
        {children}
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
