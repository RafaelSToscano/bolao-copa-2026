"use client";

import { Game } from "@/types/game";
import { Prediction } from "@/types/prediction";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flag } from "@/components/ui/Flag";
import { formatDate, exportAuditCsv } from "@/lib/formatting";
import { calculatePredictionPoints } from "@/services/predictions/predictionCalculations";

interface AdminSectionProps {
  games: Game[];
  predictions: Prediction[];
  players: any[];
  onUpdateResult: (
    gameId: string,
    field: "official_score_a" | "official_score_b",
    value: string
  ) => void;
  stats: {
    totalPlayers: number;
    approvedPlayers: number;
    pendingPlayers: number;
    activePlayers: number;
  };
}

export function AdminSection({
  games,
  predictions,
  players,
  onUpdateResult,
  stats,
}: AdminSectionProps) {
  const handleExportCsv = () => {
    exportAuditCsv(players, games, predictions, calculatePredictionPoints);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black">Painel Admin</h2>
        <p className="text-slate-400 text-sm">
          Lance os resultados oficiais dos jogos.
        </p>
        <Button
          onClick={handleExportCsv}
          className="mt-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
        >
          Exportar auditoria CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl min-h-[135px] md:min-h-0 flex items-center justify-center">
          <CardContent className="p-4 text-center flex flex-col items-center justify-center">
            <div className="text-base md:text-sm text-slate-400">
              Participantes
            </div>
            <div className="text-4xl md:text-3xl font-black text-yellow-400">
              {stats.totalPlayers}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl min-h-[135px] md:min-h-0 flex items-center justify-center">
          <CardContent className="p-4 text-center flex flex-col items-center justify-center">
            <div className="text-base md:text-sm text-slate-400">Aprovados</div>
            <div className="text-4xl md:text-3xl font-black text-emerald-400">
              {stats.approvedPlayers}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl min-h-[135px] md:min-h-0 flex items-center justify-center">
          <CardContent className="p-4 text-center flex flex-col items-center justify-center">
            <div className="text-base md:text-sm text-slate-400">Pendentes</div>
            <div className="text-4xl md:text-3xl font-black text-red-400">
              {stats.pendingPlayers}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white rounded-2xl min-h-[135px] md:min-h-0 flex items-center justify-center">
          <CardContent className="p-4 text-center flex flex-col items-center justify-center">
            <div className="text-base md:text-sm text-slate-400">
              Já palpitou
            </div>
            <div className="text-4xl md:text-3xl font-black text-blue-400">
              {stats.activePlayers}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Games with Result Input */}
      <div className="space-y-3">
        {games.map((game) => (
          <Card
            key={game.id}
            className="bg-slate-900 border-slate-800 text-white rounded-2xl"
          >
            <CardContent className="p-0">
              <div className="grid grid-cols-[120px_160px_34px_34px_24px_34px_34px_160px] items-center justify-center bg-[#F1F1F1] border-b border-white text-[#111] text-[12px] min-h-[24px]">
                <div className="px-1 text-[10px] whitespace-nowrap text-center text-slate-400">
                  {formatDate(game.match_date)}
                </div>

                <div className="pr-1 text-right font-semibold truncate text-[12px]">
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
                      onUpdateResult(
                        game.id,
                        "official_score_a",
                        e.target.value
                      )
                    }
                    className="h-6 w-7 rounded-none border border-[#2A398D] bg-white text-center text-[12px] font-semibold text-[#111] p-0"
                  />
                </div>

                <div className="text-center text-xs font-bold text-[#2A398D]">
                  x
                </div>

                <div className="flex justify-center">
                  <Input
                    type="number"
                    min="0"
                    value={game.official_score_b ?? ""}
                    onChange={(e) =>
                      onUpdateResult(
                        game.id,
                        "official_score_b",
                        e.target.value
                      )
                    }
                    className="h-6 w-7 rounded-none border border-[#2A398D] bg-white text-center text-[12px] font-semibold text-[#111] p-0"
                  />
                </div>

                <div className="flex justify-center">
                  <Flag team={game.team_b} />
                </div>

                <div className="pl-1 font-semibold truncate text-[12px]">
                  {game.team_b}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
