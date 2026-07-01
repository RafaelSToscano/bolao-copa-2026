"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { Player } from "@/types/player";
import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { KnockoutMatchRecord, KnockoutPrediction } from "@/types/knockout";
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
import type { RandomPrediction } from "@/components/ui/random-predictor";

type AppShellContextValue = {
  currentUser: Player;
  players: Player[];
  games: Game[];
  predictions: Prediction[];
  knockoutMatches: KnockoutMatchRecord[];
  knockoutPredictions: KnockoutPrediction[];
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
  const pathname = usePathname();

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
    loading: dataLoading,
    error: dataError,
    loadData,
    invalidateCache,
    setPredictions,
    setGames,
    setKnockoutMatches,
  } = useData(currentUser?.id, {
    includeAllPredictions:
  currentUser?.is_admin === true ||
  pathname === "/ranking" ||
  pathname === "/simulador" ||
  pathname === "/palpites-da-galera" ||
  pathname === "/historico",
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
    knockoutPredictions
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

  const shouldForceReload =
    pathname === "/" ||
    pathname === "/palpites" ||
    pathname === "/mata-mata";

  void loadData({ force: shouldForceReload });
}, [currentUser?.id, loadData, pathname]);

  const handleLogin = async (accessCode: string, password: string) => {
    const success = await login(accessCode, password);
    if (success) {
      try {
        const savedUser = localStorage.getItem("bolao_user");
        if (savedUser) JSON.parse(savedUser);
      } catch {
        localStorage.removeItem("bolao_user");
      }
      await loadData({ force: true });
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

      if (currentUser?.id) {
        void fetch("/api/dashboard/cache/evict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id }),
        }).catch(() => {});
      }

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

      if (currentUser?.id) {
        void fetch("/api/dashboard/cache/evict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id }),
        }).catch(() => {});
      }

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
    await loadData({ force: true });
  };

  const handleRejectPlayer = async (playerId: string) => {
    await playersService.rejectPlayer(playerId);
    invalidateCache();
    await loadData({ force: true });
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