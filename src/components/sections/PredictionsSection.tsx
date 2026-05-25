"use client";

import { Game } from "@/types/game";
import { Prediction, DraftPrediction } from "@/types/prediction";
import { TeamStanding } from "@/types/standings";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RandomPredictor, SingleGameRandomPredictor, type RandomPrediction } from "@/components/ui/random-predictor";
import { Flag } from "@/components/ui/Flag";
import { formatDate } from "@/lib/formatting";
import { calculateGroupStandingsFromPredictions } from "@/services/standings/predictionSimulation";

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
  userStats,
}: PredictionsSectionProps) {
  const groupedGames = games.reduce((acc: Record<string, Game[]>, game) => {
    const group = game.group_name || "Outros";
    if (!acc[group]) acc[group] = [];
    acc[group].push(game);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl min-h-[120px] md:min-h-[90px] flex items-center justify-center">
          <CardContent className="p-4 text-center flex flex-col items-center justify-center">
            <div className="text-4xl md:text-3xl text-slate-400">Jogos</div>
            <div className="text-4xl md:text-3xl font-black text-yellow-400">
              {userStats.totalUserGames}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl min-h-[120px] md:min-h-[90px] flex items-center justify-center">
          <CardContent className="p-4 text-center flex flex-col items-center justify-center">
            <div className="text-4xl md:text-3xl text-slate-400">Palpitados</div>
            <div className="text-4xl md:text-3xl font-black text-emerald-400">
              {userStats.userPredictedGames}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl min-h-[120px] md:min-h-[90px] flex items-center justify-center">
          <CardContent className="p-4 text-center flex flex-col items-center justify-center">
            <div className="text-4xl md:text-3xl text-slate-400">Pendentes</div>
            <div className="text-4xl md:text-3xl font-black text-red-400">
              {userStats.userPendingGames}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl min-h-[120px] md:min-h-[90px] flex items-center justify-center">
          <CardContent className="p-4 text-center flex flex-col items-center justify-center">
            <div className="text-4xl md:text-3xl text-slate-400">% concluído</div>
            <div className="text-4xl md:text-3xl font-black text-blue-400">
              {userStats.userCompletion}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">Meus Palpites</h2>
          <div>
            <p className="text-slate-400 text-sm">
              Preencha os placares. O salvamento é automático.
            </p>
            {groupsLocked && (
              <p className="text-red-400 text-sm font-semibold mt-1">
                Palpites encerrados para a fase de grupos.
              </p>
            )}
          </div>
        </div>

        <RandomPredictor
          games={games.filter((g) => !groupsLocked && !g.locked)}
          onGeneratePredictions={onRandomPredictions}
          disabled={groupsLocked}
          buttonLabel="Palpites Aleatórios"
        />
      </div>

      {/* Groups */}
      <div className="space-y-8">
        {Object.entries(groupedGames).map(([group, groupGames]) => (
          <div
            key={group}
            className="space-y-4 bg-slate-900/70 border border-slate-800 rounded-3xl p-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-500 text-slate-950 flex items-center justify-center font-black">
                {group}
              </div>
              <div>
                <h3 className="text-2xl font-black">Grupo {group}</h3>
                <p className="text-slate-400 text-sm">Fase de grupos</p>
              </div>
            </div>

            {/* Standings Table */}
            {(() => {
              const standings = calculateGroupStandingsFromPredictions(groupGames, predictions, currentUserId);
              if (standings.length === 0) return null;
              return (
                <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
                  <div className="bg-[#2A398D] text-white text-center font-black text-sm md:text-base py-3 tracking-wide">
                    CLASSIFICAÇÃO - GRUPO {group}
                  </div>
                  <div className="grid grid-cols-12 text-xs uppercase tracking-wide text-slate-400 px-3 py-2 font-bold border-b border-slate-800">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-4">Seleção</div>
                    <div className="col-span-1 text-center">P</div>
                    <div className="col-span-1 text-center">J</div>
                    <div className="col-span-1 text-center">V</div>
                    <div className="col-span-1 text-center">E</div>
                    <div className="col-span-1 text-center">D</div>
                    <div className="col-span-1 text-center">SG</div>
                    <div className="col-span-1 text-center">GP</div>
                  </div>
                  {standings.map((team: TeamStanding, index: number) => (
                    <div
                      key={team.team}
                      className={`grid grid-cols-12 px-3 py-3 border-t border-slate-800 items-center ${
                        index < 2 ? "bg-emerald-900/20" : ""
                      }`}
                    >
                      <div className="col-span-1 text-center font-black text-yellow-400 text-sm">
                        {index + 1}º
                      </div>
                      <div className="col-span-4 font-semibold text-sm flex items-center gap-1">
                        <Flag team={team.team} />
                        {team.team}
                      </div>
                      <div className="col-span-1 text-center font-bold">{team.points}</div>
                      <div className="col-span-1 text-center">{team.played}</div>
                      <div className="col-span-1 text-center">{team.wins}</div>
                      <div className="col-span-1 text-center">{team.draws}</div>
                      <div className="col-span-1 text-center">{team.losses}</div>
                      <div className="col-span-1 text-center">{team.goalDiff}</div>
                      <div className="col-span-1 text-center">{team.goalsFor}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Games Grid */}
            <div className="space-y-4 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-[#2A398D] text-white text-center font-black text-sm md:text-base py-3 tracking-wide">
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

                return (
                  <div
                    key={game.id}
                    className="grid grid-cols-[76px_minmax(76px,1fr)_32px_38px_18px_38px_32px_minmax(76px,1fr)_32px] md:grid-cols-[90px_minmax(100px,1fr)_34px_48px_24px_48px_34px_minmax(100px,1fr)_40px] items-center bg-slate-900 border-b border-slate-800 text-white text-sm md:text-base min-h-[48px] md:min-h-[58px] px-2 md:px-3"
                  >
                    <div className="text-slate-300 text-[10px] md:text-sm whitespace-nowrap">
                      {formatDate(game.match_date)}
                    </div>

                    <div className="text-right font-semibold truncate pr-4 text-sm md:text-base">
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
                          onSinglePrediction(
                            game.id,
                            "predicted_score_a",
                            value
                          );
                        }}
                        className="h-9 w-10 md:h-10 md:w-12 rounded-lg border border-[#2A398D] bg-slate-950 text-center text-base md:text-lg font-bold text-white p-0"
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
                          onSinglePrediction(
                            game.id,
                            "predicted_score_b",
                            value
                          );
                        }}
                        className="h-8 w-9 rounded-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
                      />
                    </div>

                    <div className="flex justify-center">
                      <Flag team={game.team_b} />
                    </div>

                    <div className="font-semibold truncate pl-4 text-sm md:text-base">
                      {game.team_b}
                    </div>

                    <div className="flex justify-center items-center">
                      <SingleGameRandomPredictor
                        gameId={game.id}
                        onGeneratePrediction={onSingleRandomPrediction}
                        disabled={groupsLocked || game.locked}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
