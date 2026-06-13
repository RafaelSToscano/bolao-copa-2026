"use client";

import { Game } from "@/types/game";
import { Prediction, DraftPrediction } from "@/types/prediction";
import { TeamStanding } from "@/types/standings";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RandomPredictor, SingleGameRandomPredictor, type RandomPrediction } from "@/components/ui/random-predictor";
import { Flag } from "@/components/ui/Flag";
import { formatDate, isToday } from "@/lib/formatting";
import { calculateGroupStandingsFromPredictions } from "@/services/standings/predictionSimulation";
import { FinalPredictionsCard } from "@/components/sections/FinalPredictionsCard";
import { NextGameBanner } from "@/components/ui/NextGameBanner";
interface PredictionsSectionProps {
  games: Game[];
  predictions: Prediction[];
  drafts: Record<string, DraftPrediction>;
  groupsLocked: boolean;
  currentUserId: string;
  onDraftChange: (gameId: string, scores: DraftPrediction) => void;
  onSinglePrediction: (
    gameId: string,
    field: "predicted_score_a" | "predicted_score_b",
    value: string
  ) => void;
  onRandomPredictions: (predictions: RandomPrediction[]) => void;
  onSingleRandomPrediction: (prediction: RandomPrediction) => void;
  onClearPredictions: () => void;
  userStats: {
    totalUserGames: number;
    userPredictedGames: number;
    userPendingGames: number;
    userCompletion: number;
  };
}

export function PredictionsSection({
  games,
  predictions,
  drafts,
  groupsLocked,
  currentUserId,
  onDraftChange,
  onSinglePrediction,
  onRandomPredictions,
  onSingleRandomPrediction,
  onClearPredictions,
  userStats,
}: PredictionsSectionProps) {
  const groupedGames = games.reduce((acc: Record<string, Game[]>, game) => {
    const group = game.group_name || "Outros";
    if (!acc[group]) acc[group] = [];
    acc[group].push(game);
    return acc;
  }, {});
  Object.values(groupedGames).forEach((g) =>
    g.sort((a, b) => (a.match_date ?? "").localeCompare(b.match_date ?? ""))
  );

  return (
    <div className="space-y-4">
      <NextGameBanner
        games={games}
        predictions={predictions}
        currentUserId={currentUserId}
        limit={Infinity}
      />
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl min-h-[92px] lg:min-h-[130px] flex items-center justify-center shadow-2xl">
          <CardContent className="p-3 lg:p-5 text-center flex flex-col items-center justify-center gap-1 lg:gap-2">
            <div className="text-sm lg:text-lg font-bold text-slate-300">Jogos</div>
            <div className="text-4xl lg:text-5xl font-black text-yellow-400">
              {userStats.totalUserGames}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl min-h-[92px] lg:min-h-[130px] flex items-center justify-center shadow-2xl">
          <CardContent className="p-3 lg:p-5 text-center flex flex-col items-center justify-center gap-1 lg:gap-2">
            <div className="text-sm lg:text-lg font-bold text-slate-300">Palpitados</div>
            <div className="text-4xl lg:text-5xl font-black text-emerald-400">
              {userStats.userPredictedGames}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl min-h-[92px] lg:min-h-[130px] flex items-center justify-center shadow-2xl">
          <CardContent className="p-3 lg:p-5 text-center flex flex-col items-center justify-center gap-1 lg:gap-2">
            <div className="text-sm lg:text-lg font-bold text-slate-300">Pendentes</div>
            <div className="text-4xl lg:text-5xl font-black text-red-400">
              {userStats.userPendingGames}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl min-h-[92px] lg:min-h-[130px] flex items-center justify-center shadow-2xl">
          <CardContent className="p-3 lg:p-5 text-center flex flex-col items-center justify-center gap-1 lg:gap-2">
            <div className="text-sm lg:text-lg font-bold text-slate-300">% concluído</div>
            <div className="text-4xl lg:text-5xl font-black text-blue-400">
              {userStats.userCompletion}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight">
          Meus Palpites
          </h2>
          <div>
            <p className="text-slate-400 text-base mt-1">
              Preencha os placares. O salvamento é automático.
            </p>
            {groupsLocked && (
              <p className="text-red-400 text-sm font-semibold mt-1">
                Palpites encerrados para a fase de grupos.
              </p>
            )}
          </div>
        </div>
        </div>
      
        <FinalPredictionsCard
        playerId={currentUserId}
        games={games}
        disabled={groupsLocked}
/>

{/* Mobile Actions */}
<Card className="lg:hidden bg-gradient-to-br from-[#2A398D] via-slate-900 to-[#3CAC3B] border border-slate-700 rounded-3xl text-white overflow-hidden shadow-2xl">
  <CardContent className="p-5 space-y-4">
    <div>
      <h3 className="text-2xl font-black">
        Palpites Aleatórios
      </h3>

      <p className="text-white/80 text-sm mt-2">
        Gere palpites apenas para os jogos ainda não preenchidos.
      </p>
    </div>

    <RandomPredictor
      games={games.filter((game) => {
        if (groupsLocked || game.locked) return false;

        const prediction = predictions.find(
          (p) => p.player_id === currentUserId && p.game_id === game.id
        );

        return (
          !prediction ||
          prediction.predicted_score_a === null ||
          prediction.predicted_score_b === null
        );
      })}
      onGeneratePredictions={onRandomPredictions}
      disabled={groupsLocked || userStats.userPendingGames === 0}
      buttonLabel={
        userStats.userPendingGames === 0
          ? "Tudo preenchido"
          : "Gerar Pendentes"
      }
    />

   <div className="pt-1">
  <button
    type="button"
    onClick={onClearPredictions}
    disabled={groupsLocked || userStats.userPredictedGames === 0}
    className="text-xs text-white/60 hover:text-white/90 underline underline-offset-4 disabled:opacity-40 disabled:cursor-not-allowed"
  >
    Limpar meus palpites
  </button>
</div>
  </CardContent>
</Card>
        {/* Desktop Dashboard Layout */}
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 items-start">
        {/* Main Content */}
        <div id="group-predictions" className="space-y-8">
        {Object.entries(groupedGames).map(([group, groupGames]) => (
          <div
            key={group}
            className="space-y-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[28px] p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
  <div className="flex items-center gap-4">
    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-xl">
      {group}
    </div>

    <div>
      <h3 className="text-3xl font-black leading-tight">
        Grupo {group}
      </h3>

      <p className="text-slate-400 text-sm">
        Fase de grupos
      </p>
    </div>
  </div>

  <div className="hidden lg:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2">
    <div className="h-2 w-2 rounded-full bg-emerald-400" />

    <span className="text-sm text-slate-300 font-medium">
      {groupGames.length} jogos
    </span>
  </div>
</div>

            {/* Standings Table */}
{(() => {
  const standings = calculateGroupStandingsFromPredictions(
    groupGames,
    predictions,
    currentUserId
  );

  if (standings.length === 0) return null;

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="bg-gradient-to-r from-[#2A398D] to-slate-900 text-white text-center font-black text-base lg:text-lg py-4 tracking-wide">
        CLASSIFICAÇÃO - GRUPO {group}
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[52px_280px_260px] items-center justify-center text-xs lg:text-sm uppercase tracking-wide text-slate-300 px-4 py-3 font-black border-b border-slate-800 bg-slate-950">
          <div className="text-center">#</div>
          <div>Seleção</div>

          <div className="grid grid-cols-7 gap-2 text-center">
            <div>P</div>
            <div>J</div>
            <div>V</div>
            <div>E</div>
            <div>D</div>
            <div>SG</div>
            <div>GP</div>
          </div>
        </div>

        {standings.map((team: TeamStanding, index: number) => (
          <div
            key={team.team}
            className={`grid grid-cols-[52px_280px_260px] items-center justify-center px-4 py-4 border-t border-slate-800 text-sm lg:text-base ${
              index < 2 ? "bg-emerald-900/20" : ""
            }`}
          >
            <div className="text-center font-black text-yellow-400">
              {index + 1}º
            </div>

            <div className="font-black text-base lg:text-lg flex items-center gap-3 min-w-0">
              <Flag team={team.team} />
              <span className="truncate">{team.team}</span>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center font-semibold">
              <div>{team.points}</div>
              <div>{team.played}</div>
              <div>{team.wins}</div>
              <div>{team.draws}</div>
              <div>{team.losses}</div>
              <div>{team.goalDiff}</div>
              <div>{team.goalsFor}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-slate-800">
        {standings.map((team: TeamStanding, index: number) => (
          <div
            key={team.team}
            className={`flex items-center justify-between px-4 py-4 ${
              index < 2 ? "bg-emerald-900/20" : ""
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-yellow-400 font-black w-8 shrink-0">
                {index + 1}º
              </span>

              <Flag team={team.team} />

              <span className="font-black text-base truncate">
                {team.team}
              </span>
            </div>

            <div className="text-right shrink-0 ml-3">
              <div className="text-yellow-400 font-black text-lg">
                {team.points} pts
              </div>

              <div className="text-[11px] text-slate-400">
                J:{team.played} V:{team.wins} SG:{team.goalDiff}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
})()}

           {/* Games Grid */}
            <div className="space-y-0 bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-[#2A398D] to-slate-900 text-white text-center font-black text-base lg:text-lg py-4 tracking-wide">
            JOGOS - GRUPO {group}
            </div>

              {groupGames.map((game: Game) => {
                const existing = predictions.find(
                  (p) =>
                    p.player_id === currentUserId &&
                    p.game_id === game.id
                );

                const draft = drafts[game.id] || {
                  predicted_score_a: existing?.predicted_score_a?.toString() ?? "",
                  predicted_score_b: existing?.predicted_score_b?.toString() ?? "",
                };

               const today = isToday(game.match_date);
               return (
  <div
    key={game.id}
    className={`border-b transition ${
      today
        ? "border-slate-800 bg-amber-500/[0.04] border-l-2 border-l-amber-500/60 hover:bg-amber-500/[0.07]"
        : "border-slate-800 bg-slate-950/40 hover:bg-slate-900/70"
    }`}
  >
    {/* Mobile */}
    <div className="md:hidden p-3 space-y-3">
      <div className="flex items-center justify-between text-slate-300 text-xs">
        <span>{formatDate(game.match_date)}</span>

        <SingleGameRandomPredictor
          gameId={game.id}
          onGeneratePrediction={onSingleRandomPrediction}
          disabled={groupsLocked || game.locked}
        />
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
            disabled={groupsLocked || game.locked}
            value={draft.predicted_score_a}
            onChange={(e) => {
              const value = e.target.value;
              onDraftChange(game.id, {
                ...draft,
                predicted_score_a: value,
              });
              onSinglePrediction(game.id, "predicted_score_a", value);
            }}
            className="h-11 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
          />

          <span className="font-black text-slate-300">x</span>

          <Input
            type="number"
            min="0"
            disabled={groupsLocked || game.locked}
            value={draft.predicted_score_b}
            onChange={(e) => {
              const value = e.target.value;
              onDraftChange(game.id, {
                ...draft,
                predicted_score_b: value,
              });
              onSinglePrediction(game.id, "predicted_score_b", value);
            }}
            className="h-11 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
          />
        </div>

        <div className="flex items-center justify-start gap-2 min-w-0">
          <Flag team={game.team_b} />
          <span className="font-bold text-sm truncate">
            {game.team_b}
          </span>
        </div>
      </div>
    </div>

    {/* Desktop */}
    <div className="hidden md:grid md:grid-cols-[120px_minmax(150px,1fr)_40px_48px_24px_48px_40px_minmax(150px,1fr)_90px] items-center text-white text-lg min-h-[54px] px-4">
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
          disabled={groupsLocked || game.locked}
          value={draft.predicted_score_a}
          onChange={(e) => {
            const value = e.target.value;
            onDraftChange(game.id, {
              ...draft,
              predicted_score_a: value,
            });
            onSinglePrediction(game.id, "predicted_score_a", value);
          }}
          className="h-10 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
        />
      </div>

      <div className="text-center font-bold text-slate-300">x</div>

      <div className="flex justify-center">
        <Input
          type="number"
          min="0"
          disabled={groupsLocked || game.locked}
          value={draft.predicted_score_b}
          onChange={(e) => {
            const value = e.target.value;
            onDraftChange(game.id, {
              ...draft,
              predicted_score_b: value,
            });
            onSinglePrediction(game.id, "predicted_score_b", value);
          }}
          className="h-10 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
        />
      </div>

      <div className="flex justify-center">
        <Flag team={game.team_b} />
      </div>

      <div className="font-bold truncate pl-5 text-lg">
        {game.team_b}
      </div>

      <div className="flex justify-center items-center scale-90 opacity-80 hover:opacity-100 transition pr-2">
        <SingleGameRandomPredictor
          gameId={game.id}
          onGeneratePrediction={onSingleRandomPrediction}
          disabled={groupsLocked || game.locked}
        />
      </div>
    </div>
    </div>
);
              })}
            </div>
          </div>
              ))}
      </div>

      {/* Desktop Right Sidebar */}
      <aside className="hidden lg:flex flex-col gap-6 sticky top-8">

        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 rounded-3xl text-white shadow-2xl">
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-2xl font-black">
              Resumo do Bolão
              </h3>

              <p className="text-slate-400 text-sm">
                Seus palpites na Copa 2026
              </p>
            </div>

            <div className="space-y-3">

              <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-lg">
                <div className="text-slate-400 text-sm">
                  Jogos preenchidos
                </div>

                <div className="text-3xl font-black text-emerald-400">
                  {userStats.userPredictedGames}
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-lg">
                <div className="text-slate-400 text-sm">
                  Pendentes
                </div>

                <div className="text-3xl font-black text-red-400">
                  {userStats.userPendingGames}
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-lg">
                <div className="text-slate-400 text-sm">
                  Conclusão
                </div>

                <div className="text-3xl font-black text-blue-400">
                  {userStats.userCompletion}%
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#2A398D] via-slate-900 to-[#3CAC3B] border border-slate-700 rounded-3xl text-white overflow-hidden shadow-2xl">
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-2xl font-black leading-tight">
                Palpites Aleatórios
              </h3>

              <p className="text-white/80 text-sm mt-2">
                Gere palpites automáticos para acelerar seu preenchimento.
              </p>
            </div>
            
            <p className="text-white/70 text-xs">
            Esta ação preenche aleatoriamente apenas os jogos que ainda estão sem palpite.
          </p>
            <RandomPredictor
            games={games.filter((game) => {
            if (groupsLocked || game.locked) return false;

            const prediction = predictions.find(
            (p) => p.player_id === currentUserId && p.game_id === game.id
            );

            return (
            !prediction ||
            prediction.predicted_score_a === null ||
            prediction.predicted_score_b === null
            );
            })}
            onGeneratePredictions={onRandomPredictions}
            disabled={groupsLocked || userStats.userPendingGames === 0}
            buttonLabel={
            userStats.userPendingGames === 0
           ? "Tudo preenchido"
           : "Gerar Pendentes"
            }
            />
            <div className="flex flex-col items-start gap-2">
 <div className="flex flex-col items-start gap-2">
  <Button
    type="button"
    onClick={onClearPredictions}
    disabled={groupsLocked || userStats.userPredictedGames === 0}
    variant="ghost"
    size="sm"
    className="
      h-auto
      px-1
      text-sm
      font-medium
      text-white/60
      hover:text-white/90
      hover:bg-transparent
    "
  >
    Limpar meus palpites
  </Button>
</div>
</div>
          </CardContent>
        </Card>

            </aside>
    </div>
  </div>
  );
}