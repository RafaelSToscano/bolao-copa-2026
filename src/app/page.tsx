"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useData } from "@/hooks/useData";
import { usePredictions } from "@/hooks/usePredictions";
import { usePhaseState } from "@/hooks/usePhaseState";
import { useStandings } from "@/hooks/useStandings";
import { useRanking } from "@/hooks/useRanking";
import { useKnockout } from "@/hooks/useKnockout";
import { useAppStats } from "@/hooks/useAppStats";
import { AuthForm } from "@/components/forms/AuthForm";
import { AppLayout } from "@/components/layouts/AppLayout";
import { PredictionsSection } from "@/components/sections/PredictionsSection";
import { StandingsSection } from "@/components/sections/StandingsSection";
import { KnockoutSection } from "@/components/sections/KnockoutSection";
import { RankingSection } from "@/components/sections/RankingSection";
import { AdminSection } from "@/components/sections/AdminSection";
import { Card } from "@/components/ui/card";
import { calculatePredictionPoints } from "@/services/predictions/predictionCalculations";
import { gamesService } from "@/services/supabase/gamesService";
import { calculateGroupStandingsFromPredictions, buildGamesFromPredictions } from "@/services/standings/predictionSimulation";
import { calculateBestThirdPlace, calculateQualifiedTeams } from "@/services/standings/standingsCalculations";
import type { RandomPrediction } from "@/components/ui/random-predictor";
import { playersService } from "@/services/supabase/playersService";
import { SimulationSection } from "@/components/sections/SimulationSection";
import { RulesSection } from "@/components/sections/RulesSection";
import { PlayoffSection } from "@/components/sections/PlayoffSection";

type TabType =
  | "palpites"
  | "classificacao"
  | "matamata"
  | "ranking"
  | "simulador"
  | "regras"
  | "playoff"
  | "admin";

export default function Home() {
  // Auth state
  const {
  currentUser,
  isChecking,
  login,
  requestAccess,
  logout,
  error: authError,
} = useAuth();

  // Data loading
  const {
    players,
    games,
    predictions,
    loading: dataLoading,
    error: dataError,
    loadData,
    setPredictions,
    setGames,
  } = useData();

  // Predictions management
  const {
  drafts,
  setDrafts,
  saveSinglePrediction,
  saveBatchPredictions,
  clearPlayerPredictions,
} = usePredictions(currentUser?.id, games, predictions, setPredictions);

  // UI state
  const [tab, setTab] = useState<TabType>("palpites");
  const [loginName, setLoginName] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [message, setMessage] = useState("");

  // Phase state
  const { isGroupsLocked } = usePhaseState();
  const groupsLocked = isGroupsLocked();

  // Calculated data
  const { allGroupStandings, bestThirdPlace, qualifiedTeams } = useStandings(
    games,
    predictions
  );
  const { ranking } = useRanking(players, games, predictions);
  const { round32 } = useKnockout(games, predictions, currentUser?.id);
  const stats = useAppStats(players, games, predictions, currentUser?.id);

  // Load data on mount
  useEffect(() => {
  if (currentUser?.id) {
    loadData(currentUser.id);
  }
}, [currentUser?.id]);

  const handleLogin = async (accessCode: string, password: string) => {
  setLoginName("");
  setLoginCode("");
  const success = await login(accessCode, password);
    if (success) {
  const savedUser = localStorage.getItem("bolao_user");
  const user = savedUser ? JSON.parse(savedUser) : null;
  await loadData(user?.id);
}
  };
    
  const handleRequestAccess = async (
  name: string,
  accessCode: string,
  password: string
): Promise<void> => {
  await requestAccess(name, accessCode, password);
};
  
    const handleTabChange = async (newTab: TabType) => {
    setTab(newTab);
    await loadData(currentUser?.id);
  };

  const handleUpdateOfficialResult = async (
    gameId: string,
    field: "official_score_a" | "official_score_b",
    value: string
  ) => {
    try {
      const parsed = value === "" ? null : Number(value);
      await gamesService.updateOfficialResult(gameId, field, parsed);

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

      setMessage("Resultado atualizado com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Erro ao atualizar resultado."
      );
    }
  };

  const handleApplyRandomPredictions = async (
    randomPredictions: RandomPrediction[]
  ) => {
    if (!currentUser) return;

    setMessage("");

    try {
      // Update drafts with random predictions
      const updatedDrafts: Record<string, { predicted_score_a: string; predicted_score_b: string }> = {
        ...drafts,
      };
      for (const pred of randomPredictions) {
        updatedDrafts[pred.game_id] = {
          predicted_score_a: String(pred.predicted_score_a),
          predicted_score_b: String(pred.predicted_score_b),
        };
      }
      setDrafts(updatedDrafts);

      // Save all predictions to Supabase
      const predictionPayload = randomPredictions.map((pred) => ({
        player_id: currentUser.id,
        game_id: pred.game_id,
        predicted_score_a: pred.predicted_score_a,
        predicted_score_b: pred.predicted_score_b,
      }));

      await saveBatchPredictions(predictionPayload);
      setMessage("Palpites aleatórios aplicados com sucesso!");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Erro ao aplicar palpites aleatórios."
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

      // Update drafts
      setDrafts((prev) => ({
        ...prev,
        [randomPrediction.game_id]: {
          predicted_score_a: String(randomPrediction.predicted_score_a),
          predicted_score_b: String(randomPrediction.predicted_score_b),
        },
      }));

      // Save to Supabase
      await saveBatchPredictions([updatedPrediction]);
    } catch (err) {
      console.error("Failed to apply single random prediction:", err);
    }
  };
    const handleApprovePlayer = async (playerId: string) => {
    await playersService.approvePlayer(playerId);
    await loadData(currentUser?.id);
    };
    const handleRejectPlayer = async (playerId: string) => {
  await playersService.rejectPlayer(playerId);
  await loadData(currentUser?.id);
    };
const handleClearPredictions = async () => {
  if (groupsLocked) return;

  const confirmed = window.confirm(
    "Tem certeza que deseja apagar todos os seus palpites?"
  );

  if (!confirmed) return;

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

  return (
    <AppLayout
      currentUser={currentUser}
      activeTab={tab}
      onTabChange={handleTabChange}
      onLogout={logout}
    >
      {/* Message Display */}
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

      {/* Tab Content */}
      {tab === "palpites" && currentUser && (
        <PredictionsSection
          games={games}
          predictions={predictions}
          drafts={drafts}
          groupsLocked={groupsLocked}
          currentUserId={currentUser.id}
          onDraftChange={(gameId, scores) => {
            setDrafts((prev) => ({
              ...prev,
              [gameId]: scores,
            }));
          }}
          onSinglePrediction={saveSinglePrediction}
          onRandomPredictions={handleApplyRandomPredictions}
          onSingleRandomPrediction={handleApplySingleRandomPrediction}
          onClearPredictions={handleClearPredictions}
          userStats={{
            totalUserGames: stats.totalUserGames,
            userPredictedGames: stats.userPredictedGames,
            userPendingGames: stats.userPendingGames,
            userCompletion: stats.userCompletion,
          }}
        />
      )}

      {tab === "classificacao" && games.length > 0 && (
        <StandingsSection
          games={games}
          predictions={predictions}
          allGroupStandings={allGroupStandings}
          bestThirdPlace={bestThirdPlace}
          calculateGroupStandingsFromPredictions={calculateGroupStandingsFromPredictions}
          currentUserId={currentUser.id}
        />
      )}

      {tab === "matamata" && currentUser && (
        <KnockoutSection
          games={games}
          predictions={predictions}
          round32={round32}
          qualifiedTeams={qualifiedTeams}
          currentUserId={currentUser.id}
        />
      )}

      {tab === "ranking" && (
        <RankingSection ranking={ranking} />
      )}
      
      {tab === "simulador" && (
      <SimulationSection
       games={games}
        players={players}
        predictions={predictions}
  />  )}
      
      {tab === "playoff" && (
        <PlayoffSection round32={round32} />
      )}

      {tab === "regras" && (
        <RulesSection />
      )}
      
      {tab === "admin" && currentUser.is_admin && (
        <AdminSection
          games={games}
          predictions={predictions}
          players={players}
          onUpdateResult={handleUpdateOfficialResult}
          onApprovePlayer={handleApprovePlayer}
          onRejectPlayer={handleRejectPlayer}
         stats={{
         totalPlayers: stats.totalPlayers,
        approvedPlayers: stats.approvedPlayers,
        pendingPlayers: stats.pendingPlayers,
        activePlayers: stats.activePlayers,
        incompletePlayers: stats.incompletePlayers,
        zeroPlayers: stats.zeroPlayers,
}}
        />
      )}
    </AppLayout>
  );
}
