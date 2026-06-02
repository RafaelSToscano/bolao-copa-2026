"use client";

import { useMemo, useState } from "react";
import { Game } from "@/types/game";
import { Player } from "@/types/player";
import { Prediction } from "@/types/prediction";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calculatePredictionPoints } from "@/services/predictions/predictionCalculations";
import { Flag } from "@/components/ui/Flag";
import { formatDate } from "@/lib/formatting";

interface SimulationSectionProps {
  games: Game[];
  players: Player[];
  predictions: Prediction[];
}

export function SimulationSection({
  games,
  players,
  predictions,
}: SimulationSectionProps) {
  const availableGames = games.filter(
    (game) => game.official_score_a === null || game.official_score_b === null
  );

  const [selectedGameId, setSelectedGameId] = useState(
    availableGames[0]?.id || ""
  );
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");

  const selectedGame = availableGames.find((game) => game.id === selectedGameId);

  const simulation = useMemo(() => {
    if (!selectedGame || scoreA === "" || scoreB === "") {
      return {
        playerGamePoints: [],
        simulatedRanking: [],
      };
    }

    const simulatedGame: Game = {
      ...selectedGame,
      official_score_a: Number(scoreA),
      official_score_b: Number(scoreB),
    };

    const playerGamePoints = players
      .filter((player) => player.approved)
      .map((player) => {
        const prediction = predictions.find(
          (p) => p.player_id === player.id && p.game_id === selectedGame.id
        );

        const result = calculatePredictionPoints(prediction, simulatedGame);

        return {
          ...player,
          pointsInGame: result.points,
          exact: result.exact,
        };
      })
      .sort((a, b) => b.pointsInGame - a.pointsInGame);

    const simulatedRanking = players
      .filter((player) => player.approved)
      .map((player) => {
        let currentTotal = 0;
        let exacts = 0;

        for (const game of games) {
          if (game.id === selectedGame.id) continue;

          const prediction = predictions.find(
            (p) => p.player_id === player.id && p.game_id === game.id
          );

          const result = calculatePredictionPoints(prediction, game);
          currentTotal += result.points;
          exacts += result.exact;
        }

        const simulatedPoints =
          playerGamePoints.find((p) => p.id === player.id)?.pointsInGame || 0;

        return {
          ...player,
          total: currentTotal + simulatedPoints,
          simulatedPoints,
          exacts,
        };
      })
      .sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        return b.exacts - a.exacts;
      });

    return {
      playerGamePoints,
      simulatedRanking,
    };
  }, [selectedGame, scoreA, scoreB, players, predictions, games]);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white rounded-3xl shadow-2xl">
        <CardContent className="p-6 lg:p-8 space-y-6">
          <div>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight">
              Simulador
            </h2>

            <p className="text-slate-300 text-lg lg:text-xl mt-3">
              Simule um resultado e veja o impacto no ranking do bolão.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-base font-black text-slate-300">
              Jogo
            </label>

            <select
              value={selectedGameId}
              onChange={(e) => {
                setSelectedGameId(e.target.value);
                setScoreA("");
                setScoreB("");
              }}
              className="w-full h-14 rounded-2xl bg-slate-800 border border-slate-700 text-white text-lg font-semibold px-4"
            >
              {availableGames.map((game) => (
                <option key={game.id} value={game.id}>
                  {formatDate(game.match_date)} - {game.team_a} x {game.team_b}
                </option>
              ))}
            </select>
          </div>

          {selectedGame && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-[#2A398D] to-slate-900 text-white text-center font-black text-base lg:text-lg py-4 tracking-wide">
                SIMULAR RESULTADO
              </div>

              {/* Desktop */}
              <div className="hidden md:grid md:grid-cols-[140px_minmax(220px,1fr)_48px_56px_32px_56px_48px_minmax(220px,1fr)] items-center text-white text-xl min-h-[70px] px-8">
                <div className="text-slate-300 text-base whitespace-nowrap">
                  {formatDate(selectedGame.match_date)}
                </div>

                <div className="text-right font-bold truncate pr-5 text-lg">
                  {selectedGame.team_a}
                </div>

                <div className="flex justify-center">
                  <Flag team={selectedGame.team_a} />
                </div>

                <div className="flex justify-center">
                  <Input
                    type="number"
                    min="0"
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                    className="h-10 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
                  />
                </div>

                <div className="text-center font-bold text-slate-300">x</div>

                <div className="flex justify-center">
                  <Input
                    type="number"
                    min="0"
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                    className="h-10 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
                  />
                </div>

                <div className="flex justify-center">
                  <Flag team={selectedGame.team_b} />
                </div>

                <div className="font-bold truncate pl-5 text-lg">
                  {selectedGame.team_b}
                </div>
              </div>

              {/* Mobile */}
              <div className="md:hidden p-3 space-y-3">
                <div className="text-slate-300 text-xs">
                  {formatDate(selectedGame.match_date)}
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="flex items-center justify-end gap-2 min-w-0">
                    <span className="font-bold text-sm text-right truncate">
                      {selectedGame.team_a}
                    </span>
                    <Flag team={selectedGame.team_a} />
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={scoreA}
                      onChange={(e) => setScoreA(e.target.value)}
                      className="h-11 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
                    />

                    <span className="font-black text-slate-300">x</span>

                    <Input
                      type="number"
                      min="0"
                      value={scoreB}
                      onChange={(e) => setScoreB(e.target.value)}
                      className="h-11 w-12 rounded-xl shadow-lg border border-[#2A398D] bg-slate-950 text-center text-lg font-bold text-white p-0"
                    />
                  </div>

                  <div className="flex items-center justify-start gap-2 min-w-0">
                    <Flag team={selectedGame.team_b} />
                    <span className="font-bold text-sm truncate">
                      {selectedGame.team_b}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl shadow-2xl">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-3xl font-black">Ranking Simulado</h3>

            {simulation.simulatedRanking.map((player, index) => (
              <div
                key={player.id}
                className="grid grid-cols-[60px_1fr_110px] items-center border-b border-slate-800 py-4 text-lg"
              >
                <div className="text-yellow-400 font-black text-lg">
                  {index + 1}º
                </div>

                <div className="font-bold truncate text-lg">{player.name}</div>

                <div className="text-right">
                  <div className="font-black text-yellow-400 text-lg">
                    {player.total} pts
                  </div>
                  <div className="text-xs text-emerald-400">
                    +{player.simulatedPoints}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl shadow-2xl">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-2xl font-black">Pontos neste jogo</h3>

            {simulation.playerGamePoints.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between border-b border-slate-800 py-4 text-lg"
              >
                <div className="font-bold truncate">{player.name}</div>

                <div className="text-right">
                  <div className="font-black text-yellow-400">
                    +{player.pointsInGame} pts
                  </div>

                  {player.exact ? (
                    <div className="text-xs text-emerald-400">
                      Placar exato
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}